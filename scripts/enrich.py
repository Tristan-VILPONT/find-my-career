#!/usr/bin/env python3
"""Enrichissement des critères manquants à partir des blocs textuels Onisep.

Ne jamais inventer un fait absent du texte. En cas de silence : inconnu
(sauf utilité « en partie » par prudence, et contrainte géographique « faible »
lorsque aucune attache à un lieu précis n'est mentionnée, confiance faible).
"""

from __future__ import annotations

import csv
import json
import os
import re
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = Path(os.environ.get("ENRICH_SRC", ROOT / "data" / "work" / "fiches-textes.json"))
OUT_CSV = ROOT / "data" / "work" / "enrichi.csv"
OUT_JSON = ROOT / "data" / "source" / "enrichi.json"
OUT_DEBUG = ROOT / "data" / "work" / "enrichi-debug.json"

INCONNU = "inconnu"
CONF_H, CONF_M, CONF_F = "haute", "moyenne", "faible"

PRIMARY = ("condition_travail", "nature_travail", "vie_professionnelle")
SECONDARY = ("accroche", "format_court", "acces_metier")


def clean_raw(s: str) -> str:
    s = (s or "").replace("\xa0", " ").replace("\u202f", " ").replace("\u2009", " ")
    s = s.replace("’", "'").replace("‘", "'").replace("`", "'")
    s = s.replace("–", "-").replace("—", "-")
    s = re.sub(r"\s+", " ", s).strip()
    return s


def fold_map(s: str):
    """Lowercase, strip accents, map folded indices back to `s`."""
    folded = []
    mmap = []
    i = 0
    while i < len(s):
        ch = s[i]
        if ch in "œŒ":
            folded.append("oe")
            mmap.extend([i, i])
            i += 1
            continue
        nfd = unicodedata.normalize("NFD", ch)
        base = "".join(c for c in nfd if unicodedata.category(c) != "Mn")
        if not base:
            i += 1
            continue
        folded.append(base.lower())
        mmap.append(i)
        i += 1
    return "".join(folded), mmap, s


def quote_from(s: str, a: int, b: int, radius: int = 55) -> str:
    # Prefer the sentence that contains the match.
    sent_start = max(s.rfind(". ", 0, a), s.rfind("! ", 0, a), s.rfind("? ", 0, a), s.rfind("\n", 0, a))
    if sent_start == -1:
        sent_start = max(0, a - radius)
    else:
        sent_start += 2
    sent_end_candidates = [i for i in (s.find(". ", b), s.find("! ", b), s.find("? ", b)) if i != -1]
    sent_end = min(sent_end_candidates) + 1 if sent_end_candidates else min(len(s), b + radius)
    start = max(sent_start, a - radius)
    end = min(sent_end, b + radius + 30, len(s))
    if start > 0:
        sp = s.find(" ", start, a)
        if sp != -1:
            start = sp + 1
    if end < len(s):
        sp = s.rfind(" ", b, end)
        if sp != -1:
            end = sp
    frag = s[start:end].strip(" .,;:«»\"")
    if not frag:
        frag = s[a:b].strip()
    if start > 0:
        frag = "…" + frag
    if end < len(s):
        frag = frag + "…"
    frag = re.sub(r"\s+", " ", frag).strip()
    if len(frag) > 180:
        frag = frag[:177].rstrip() + "…"
    return frag


def search(folded: str, mmap: list[int], original: str, pattern: str, flags=0):
    """Yield (quote, start_orig, end_orig, match_text_folded)."""
    for m in re.finditer(pattern, folded, flags):
        if not mmap:
            continue
        i0 = m.start()
        i1 = max(m.start(), m.end() - 1)
        if i0 >= len(mmap) or i1 >= len(mmap):
            continue
        a = mmap[i0]
        b = mmap[i1] + 1
        yield quote_from(original, a, b), a, b, m.group(0)


def first_quote(blobs: list[tuple[str, str, list, str]], patterns, prefer_fields=None) -> str | None:
    prefer = set(prefer_fields or [])
    # pass 1: preferred fields
    sources = blobs
    if prefer:
        ordered = [b for b in blobs if b[0] in prefer] + [b for b in blobs if b[0] not in prefer]
        sources = ordered
    for field, original, mmap, folded in sources:
        if not folded:
            continue
        for pat in patterns:
            for q, *_ in search(folded, mmap, original, pat):
                return q
    return None


def is_negated(folded: str, mmap: list[int], orig_start: int) -> bool:
    fi = 0
    for i, o in enumerate(mmap):
        if o >= orig_start:
            fi = i
            break
    window = folded[max(0, fi - 50):fi]
    if re.search(r"\bsans (passer|etre|travailler|aller|effectuer|vivre)\b", window):
        return True
    if re.search(r"\b(pas|jamais) (de |d'|dans |sur |en )$", window):
        return True
    return False


def collect_hits(blobs, patterns_with_tag, skip_neg=True):
    """patterns_with_tag: list of (tag, regex, weight).
    Returns dict tag -> list of (field, quote, weight).
    """
    hits = {}
    for field, original, mmap, folded in blobs:
        if not folded:
            continue
        field_w = 1 if field == "condition_travail" else 0
        for tag, pat, bonus in patterns_with_tag:
            if bonus <= 0:
                continue
            for q, a, b, mt in search(folded, mmap, original, pat):
                if skip_neg and is_negated(folded, mmap, a):
                    continue
                hits.setdefault(tag, []).append((field, q, bonus + field_w))
    return hits


def best_quote(entries, prefer_fields=("condition_travail",)):
    if not entries:
        return None
    def key(e):
        field, q, w = e
        pref = 0 if field in prefer_fields else 1
        return (pref, -w, len(q))
    entries_sorted = sorted(entries, key=key)
    return entries_sorted[0][1]


def conf_from_weight(total, haute=5, moyenne=2):
    if total >= haute:
        return CONF_H
    if total >= moyenne:
        return CONF_M
    return CONF_F


def strip_etudes(text: str) -> str:
    cut = len(text)
    for sep in ("Durée des études", "Duree des etudes", "Après la 3e", "Après le bac"):
        i = text.find(sep)
        if i != -1:
            cut = min(cut, i)
    # also folded fallback
    folded, mmap, orig = fold_map(text)
    for sep in ("duree des etudes", "apres la 3e", "apres le bac"):
        i = folded.find(sep)
        if i != -1 and i < len(mmap):
            cut = min(cut, mmap[i])
    return text[:cut].strip()


def prepare(row: dict):
    used_primary = bool(clean_raw(row.get("condition_travail") or "") or clean_raw(row.get("nature_travail") or "") or clean_raw(row.get("vie_professionnelle") or ""))
    has_cond = bool(clean_raw(row.get("condition_travail") or "") or clean_raw(row.get("nature_travail") or ""))

    def blob(field, raw):
        raw = clean_raw(raw or "")
        if not raw:
            return None
        if field in ("format_court", "acces_metier"):
            raw = strip_etudes(raw)
            if not raw:
                return None
        folded, mmap, original = fold_map(raw)
        return (field, original, mmap, folded)

    all_blobs = []
    for field in PRIMARY + SECONDARY:
        b = blob(field, row.get(field))
        if b:
            all_blobs.append(b)

    lieu_fields = ["condition_travail", "nature_travail", "accroche", "format_court"]
    if not has_cond:
        lieu_fields.extend(["vie_professionnelle"])
    blobs_lieu = [b for b in all_blobs if b[0] in lieu_fields]

    blobs_geo = [b for b in all_blobs if b[0] in ("condition_travail", "nature_travail", "vie_professionnelle", "accroche", "format_court")]
    blobs_sens = blobs_geo
    return all_blobs, blobs_lieu, blobs_geo, blobs_sens, used_primary


# ---------------------------------------------------------------------------
# Patterns
# ---------------------------------------------------------------------------

# word-ish helpers
WB = r"(?<![a-z0-9])"
WE = r"(?![a-z0-9])"

LIEU_PATTERNS = [
    # dehors
    ("dehors", r"en plein air", 2),
    ("dehors", r"au grand air", 2),
    ("dehors", r"a l'air libre", 2),
    ("dehors", r"(dehors|en exterieur|a l'exterieur),? par tous les temps", 2),
    ("dehors", r"\ben exterieur\b", 2),
    ("dehors", r"travail\w* (essentiellement |principalement |surtout |regulierement )?(en exterieur|a l'exterieur)", 2),
    ("dehors", r"(essentiellement |principalement |surtout )(en exterieur|a l'exterieur)", 2),
    ("dehors", r"s'exerce en exterieur", 2),
    ("dehors", r"a l'exterieur ou (a l'interieur|derriere|sous)", 2),
    ("dehors", r"exerce(nt)? (essentiellement |principalement |surtout )?dehors", 3),
    ("dehors", r"travail(le|lent)? (essentiellement |principalement |surtout )?dehors", 3),
    ("dehors", r"en randonnee", 2),
    ("dehors", r"sur des sentiers", 2),
    ("dehors", r"en (haute |moyenne )?montagne", 2),
    ("dehors", r"\ben foret\b", 2),
    ("dehors", r"dans les bois", 2),
    ("dehors", r"dans les champs", 2),
    ("dehors", r"en plein champ", 2),
    ("dehors", r"sur les parcelles", 2),
    ("dehors", r"en milieu naturel", 1),
    ("dehors", r"espaces verts", 2),
    ("dehors", r"sur les toits", 2),
    ("dehors", r"en voirie", 2),
    ("dehors", r"\ben mer\b", 2),
    ("dehors", r"au large", 2),
    ("dehors", r"a bord d'(un |une )?(bateau|navire|voilier|peniche|chalutier|sous-marin)", 2),
    ("dehors", r"il ou elle embarque|personnel embarque|embarque sur", 2),
    ("dehors", r"sur un (bateau|navire|voilier)", 2),
    ("dehors", r"sur le pont (du |d'un |de )", 1),
    ("dehors", r"sur les pistes (de ski|raides|et les secours)", 2),
    ("dehors", r"securite sur les pistes", 2),
    ("dehors", r"en alpage", 2),
    ("dehors", r"a la ferme", 1),
    # atelier / chantier
    ("atelier", r"\bchantiers?\b", 2),
    ("atelier", r"\bateliers?\b", 2),
    ("atelier", r"\busines?\b", 2),
    ("atelier", r"hall de production", 2),
    ("atelier", r"chaine de production", 2),
    ("atelier", r"ligne de production", 2),
    ("atelier", r"\bfournil\b", 2),
    ("atelier", r"\bgarages?\b", 1),
    ("atelier", r"\bhangars?\b", 1),
    ("atelier", r"\bentrepots?\b", 1),
    ("atelier", r"\bcisines?\b", 0),  # typo guard
    ("atelier", r"\bcuisines?\b", 2),
    ("atelier", r"salle des machines", 2),
    ("atelier", r"bloc operatoire", 2),
    ("atelier", r"salle d'operation", 2),
    ("atelier", r"en laboratoire", 1),
    ("atelier", r"dans (son |un |le |les )?laboratoires?", 1),
    ("atelier", r"\babattoir", 2),
    ("atelier", r"chaine de montage", 2),
    ("atelier", r"poste de soudure|des soudures", 1),
    ("atelier", r"plateforme (petroliere|offshore|industrielle)", 2),
    ("atelier", r"site (de production|industriel|nucleaire)", 1),
    ("atelier", r"centrale (electrique|nucleaire|thermique|hydro)", 1),
    # bureau / indoor desk or consultation / classroom / shop
    ("bureau", r"\bbureaux?\b", 2),
    ("bureau", r"open[ -]?space", 2),
    ("bureau", r"derriere (son |un |l')ecran", 2),
    ("bureau", r"devant (son |un |l')(ecran|ordinateur)", 2),
    ("bureau", r"salle de marche", 2),
    ("bureau", r"salles de marche", 2),
    ("bureau", r"bureau d'etudes", 2),
    ("bureau", r"\bagences?\b", 0),  # too vague alone, handled carefully
    ("bureau", r"agences d'architecture", 2),
    ("bureau", r"\bcabinet\b", 2),
    ("bureau", r"dans (leur |son |un )cabinet", 3),
    ("bureau", r"cabinet (medical|medical|d'avocat|dentaire|liberal|de groupe|specialise|d'architecture|paramédical)", 2),
    ("bureau", r"cabinet (medical|d'avocat|dentaire|liberal|de groupe|specialise|d'architecture)", 2),
    ("bureau", r"siege social", 1),
    ("bureau", r"au siege", 1),
    ("bureau", r"en classe(?! de decouverte)", 2),
    ("bureau", r"devant la classe", 2),
    ("bureau", r"salle de classe", 2),
    ("bureau", r"open space", 2),
    ("bureau", r"sur un plateau", 2),
    ("bureau", r"espace ouvert regroupant", 2),
    ("bureau", r"\bhopital\b", 1),
    ("bureau", r"\bclinique\b", 1),
    ("bureau", r"etablissement[s]? de sante", 1),
    ("atelier", r"\bcaserne", 1),
    # terrain / deplacements (mixte ingredient)
    ("terrain", r"sur le terrain", 2),
    ("terrain", r"deplacements frequents", 2),
    ("terrain", r"frequents deplacements", 2),
    ("terrain", r"souvent sur le terrain", 3),
    ("terrain", r"une partie du temps sur le terrain", 3),
    ("terrain", r"partage (son|son temps de) travail entre", 2),
    ("terrain", r"se rendre chez", 1),
    ("terrain", r"visites? a domicile", 2),
    ("terrain", r"au domicile des", 2),
    ("terrain", r"soins a domicile", 2),
    ("terrain", r"deplacements sont frequents", 3),
    ("terrain", r"deplacements frequents", 3),
    ("terrain", r"intervention sur le terrain", 3),
    ("terrain", r"chez (le|les|son|ses|la|leur) (client|patients|particuliers)", 1),
    ("terrain", r"a domicile", 1),
]

# filter later: systemes embarques, "cabinet" as furniture? rare
# "agence" too broad (agence de l'eau, agences locales)

TT_EXPLICIT_POSSIBLE = [
    r"teletravail ponctuel ou partiel est possible",
    r"teletravail (ponctuel|partiel|occasionnel) est possible",
    r"jours de teletravail possibles",
    r"teletravail est possible(,|\s)+(au moins )?en partie",
    r"le teletravail est possible",
    r"teletravail (ponctuel|partiel) est possible",
]
TT_EXPLICIT_PARTIEL = [
    r"teletravail ponctuel ou partiel",
    r"teletravail (ponctuel|partiel)",
    r"au moins en partie pour ce poste",
    r"jours de teletravail",
    r"sur site ou en teletravail",
    r"en teletravail ou sur site",
    r"presentiel qu'a distance",
    r"principalement a distance, mais peut intervenir en presentiel",
]
TT_EXPLICIT_POSSIBLE_BROAD = [
    r"\bteletravail\b",
    r"exercent (parfois |parfois leur activite )?en teletravail",
    r"exercent (parfois )?leur activite en teletravail",
    r"travailler a distance, suivre",
    r"travaillent principalement a distance",
    r"activite principale se deroule a distance",
    r"travail a distance devrait limiter",
    r"parfois a distance",
]

TT_FALSE = [
    r"favoriser le teletravail",
    r"de favoriser le teletravail",
    r"enseignement a distance",
    r"formation a distance",
    r"preparation a distance",
    r"cned \(centre national d'enseignement a distance\)",
    r"vente a distance",
    r"commande a distance",
    r"combat a distance",
    r"pilote a distance",
    r"surveille[es]* a distance",
    r"reglages a distance",
    r"commander a distance",
    r"gestion a distance",
    r"assistance a distance du constructeur",
    r"mesure a distance",
    r"soins a distance",  # sometimes the product, not the job
]

HOR_DECAL = [
    ("decale", r"\bde nuit\b", 2),
    ("decale", r"\bla nuit\b", 1),
    ("decale", r"travail de nuit", 2),
    ("decale", r"gardes de nuit", 3),
    ("decale", r"de jour comme de nuit", 2),
    ("decale", r"jour et nuit", 2),
    ("decale", r"24 heures(/| sur )24", 2),
    ("decale", r"24 h sur 24", 2),
    ("decale", r"24 heures/24", 2),
    ("decale", r"7 jours sur 7", 2),
    ("decale", r"week-?ends?", 2),
    ("decale", r"les dimanches?", 2),
    ("decale", r"le dimanche", 2),
    ("decale", r"les samedis?", 1),
    ("decale", r"jours feries", 2),
    ("decale", r"horaires decales", 3),
    ("decale", r"travail poste", 3),
    ("decale", r"equipes? postee?s?", 2),
    ("decale", r"equipe[s]? (successives|tournantes)", 2),
    ("decale", r"\b3 ?x ?8\b", 3),
    ("decale", r"\b2 ?x ?8\b", 3),
    ("decale", r"\b5 ?x ?8\b", 3),
    ("decale", r"\bastreintes?\b", 2),
    ("decale", r"\bgardes de ", 2),
    ("decale", r"effectuent des gardes", 3),
    ("decale", r"vers [2-5] h du matin", 3),
    ("decale", r"[2-5] heures du matin", 3),
    ("decale", r"debutent vers [2-5] h", 3),
    ("decale", r"tres tot le matin", 2),
    ("decale", r"avant l'aube", 2),
    ("decale", r"conges scolaires", 1),
]
HOR_VAR = [
    ("var", r"horaires irreguliers", 3),
    ("var", r"horaire[s]? variable[s]?", 3),
    ("var", r"rythme irregulier", 2),
    ("var", r"rythme (des saisons|saisonnier)", 2),
    ("var", r"\bsaisonniere?s?\b", 2),
    ("var", r"selon les saisons", 2),
    ("var", r"selon les (projets|tournages|manifestations|spectacles)", 2),
    ("var", r"compte rarement son temps", 2),
    ("var", r"ne compte(nt)? pas (son|leur) temps", 2),
    ("var", r"emploi du temps charge", 1),
    ("var", r"amplitude[s]? horaire[s]?", 2),
    ("var", r"grandes amplitudes", 2),
    ("var", r"longues journees", 1),
    ("var", r"aucune journee ne se ressemble", 1),
    ("var", r"horaires souvent (etendus|flexibles|larges)", 2),
    ("var", r"soirees et week-end", 1),
]
HOR_REG = [
    ("reg", r"horaires reguliers", 3),
    ("reg", r"horaires de bureau", 3),
    ("reg", r"horaires classiques", 2),
    ("reg", r"base de 35 heures", 2),
    ("reg", r"lundi au vendredi", 2),
    ("reg", r"du lundi au vendredi", 2),
    ("reg", r"horaires diurnes", 2),
    ("reg", r"rythme scolaire", 2),
    ("reg", r"calendrier scolaire", 2),
    ("reg", r"horaires reguliers de jour", 3),
    ("reg", r"heures d'enseignement en classe", 2),
    ("reg", r"travaille de jour, selon des horaires classiques", 3),
]

UTIL_OUI = [
    ("oui", r"\bsoigne(r|nt)?\b", 2),
    ("oui", r"\bsecour(ir|t|ent)\b", 2),
    ("oui", r"prendre en charge des (patients|victimes|blesses|eleves)", 2),
    ("oui", r"\bpatients?\b", 1),
    ("oui", r"\bvictimes?\b", 1),
    ("oui", r"service public", 1),
    ("oui", r"interet general", 2),
    ("oui", r"proteger (les personnes|la population|l'environnement|la nature)", 2),
    ("oui", r"sauve(r|tage)", 1),
    ("oui", r"aide sociale", 2),
    ("oui", r"insertion (sociale|professionnelle)", 1),
    ("oui", r"education a la sante", 2),
    ("oui", r"\benseigner\b", 2),
    ("oui", r"responsabilite d'une classe", 2),
    ("oui", r"transition energetique", 1),
    ("oui", r"preserv(er|ation) de l'environnement", 2),
    ("oui", r"nourr(ir|it) (la |les )?population", 2),
    ("oui", r"securite (des personnes|publique|civile)", 2),
    ("oui", r"secours", 1),
    ("oui", r"soins (preventifs|curatifs|palliatifs|infirmiers)", 2),
    ("oui", r"chaine de soins", 2),
    ("oui", r"lutte contre", 1),
]

SENS_FORTE_AUTO = [
    ("fa", r"automatisation .{0,60}(recrutements?|effectifs?|postes?|emplois?)", 3),
    ("fa", r"(recrutements?|effectifs?|postes?|emplois?).{0,60}automatisation", 3),
    ("fa", r"metier (est |sont )?(menace|fragilise)", 3),
    ("fa", r"remplac(e|es|er) par (des )?(machines|robots|algorithmes|ordinateurs|l'ia|l'intelligence)", 3),
    ("fa", r"robotisation", 1),
    ("fa", r"de plus en plus automatise", 2),
    ("fa", r"travail est automatise", 2),
]
SENS_FORTE_CRISE = [
    ("fc", r"sensible[s]? a la conjoncture", 3),
    ("fc", r"depend(ant)? de la conjoncture", 3),
    ("fc", r"en cas de crise", 2),
    ("fc", r"\bprecarite\b", 2),
    ("fc", r"\bprecaire[s]?\b", 2),
    ("fc", r"statuts? d'intermittent", 3),
    ("fc", r"intermittent du spectacle", 3),
    ("fc", r"activite etant saisonniere", 3),
    ("fc", r"l'activite etant saisonniere", 3),
    ("fc", r"une autre activite est souvent necessaire", 3),
    ("fc", r"emplois? saisonniers?", 2),
    ("fc", r"aleas climatiques", 1),
]
SENS_FAIBLE_AUTO = [
    ("ba", r"sans remplacer l'exper", 3),
    ("ba", r"aide a l'analyse, sans remplacer", 3),
    ("ba", r"ne (peut|peuvent) (pas )?etre remplac", 3),
    ("ba", r"contact humain (est |reste )?(indispensable|essentiel)", 2),
    ("ba", r"relation (humaine|de confiance) (est |reste )?(indispensable|essentielle)", 1),
]
SENS_FAIBLE_CRISE = [
    ("bc", r"metier en tension", 3),
    ("bc", r"penurie (de|des)", 2),
    ("bc", r"forts besoins", 2),
    ("bc", r"besoins (en professionnels|ne cessent)", 2),
    ("bc", r"perspectives d'emploi (sont |semblent )?favorables", 2),
    ("bc", r"secteur (qui )?recrute", 1),
    ("bc", r"debouches (sont )?nombreux", 1),
    ("bc", r"nombreux debouches", 1),
    ("bc", r"difficultes? de recrutement", 2),
]

GEO_FORTE = [
    ("gfor", r"en (haute |moyenne )?montagne", 3),
    ("gfor", r"\bmassifs?\b", 1),
    ("gfor", r"station[s]? de ski", 3),
    ("gfor", r"\ben mer\b", 2),
    ("gfor", r"off-?shore", 3),
    ("gfor", r"plateforme petroliere", 3),
    ("gfor", r"marine marchande", 2),
    ("gfor", r"centrale nucleaire", 3),
    ("gfor", r"site nucleaire", 3),
    ("gfor", r"\bvolcans?\b", 3),
    ("gfor", r"surtout dans les grandes villes", 3),
    ("gfor", r"uniquement dans les grandes villes", 3),
    ("gfor", r"concentre[es]* (a paris|en ile-de-france|dans les grandes villes)", 3),
    ("gfor", r"principalement (a paris|en ile-de-france)", 2),
    ("gfor", r"en ile-de-france et dans les grandes villes", 2),
    ("gfor", r"\ben foret\b", 2),
    ("gfor", r"milieu forestier", 2),
    ("gfor", r"ports? de commerce", 1),
    ("gfor", r"en (haute )?mer\b", 2),
    ("gfor", r"zones? a risques eruptifs", 2),
    ("gfor", r"observatoire[s]? (volcan|astronom)", 2),
]
GEO_FAIBLE = [
    ("gfai", r"partout en france", 3),
    ("gfai", r"ensemble du territoire", 3),
    ("gfai", r"tout le territoire", 3),
    ("gfai", r"toute la france", 3),
    ("gfai", r"dans toutes les regions", 3),
    ("gfai", r"sur l'ensemble du territoire", 3),
    ("gfai", r"aussi bien en ville qu'a la campagne", 3),
    ("gfai", r"en ville comme a la campagne", 3),
    ("gfai", r"zones rurales comme dans les villes", 2),
]

OUI_SECTORS = {
    "Santé",
    "Social",
    "Enseignement",
    "Sécurité",
    "Défense",
    "Environnement",
    "Services à la personne",
}
# Agriculture / energy: useful but not automatic oui — need text support or en partie
OUI_SECTORS_SOFT = {"Agriculture", "Énergie", "Droit et justice", "Fonction publique"}

# sectors more exposed to crisis / automation (weak prior only)
CRISE_SECTORS = {
    "Tourisme",
    "Arts du spectacle",
    "Audiovisuel",
    "Hôtellerie - Restauration",
    "Mode et luxe",
    "Sport",
    "Journalisme",
}
AUTO_SECTORS = {
    "Industrie chimique",
    "Mécanique",
    "Automobile",
    "Industrie alimentaire",
    "Papiers Cartons",
    "Logistique et transport",
}


def is_false_tt_context(folded: str, span_start: int, span_end: int) -> bool:
    ctx = folded[max(0, span_start - 80) : min(len(folded), span_end + 80)]
    for pat in TT_FALSE:
        if re.search(pat, ctx):
            return True
    # "favoriser le teletravail" etc. already
    if re.search(r"favoriser le teletravail|mettre en place des visioconferences", ctx):
        return True
    if re.search(r"enseignement a distance|formation a distance|cned", ctx):
        return True
    return False


def classify_lieu(row, blobs, hits):
    debug = {}
    # filter embarque false positives (systemes embarques)
    def filtered(tag):
        out = []
        for field, q, w in hits.get(tag, []):
            qf, _, _ = fold_map(clean_raw(q))
            if tag == "dehors" and re.search(r"systemes? embarques|intelligence embarquee|electronique embarquee", qf):
                continue
            if tag == "atelier" and re.search(r"atelier de genie logiciel|atelier logiciel", qf):
                continue
            if tag == "atelier" and re.search(r"reconversion d'une usine|usine en (loft|logements|bureaux)", qf):
                continue
            if tag == "bureau" and re.search(r"\bagences?\b", qf) and not re.search(
                r"agence[s]? d'architecture|au bureau|agence[s]? de (design|communication|publicite|voyage)",
                qf,
            ):
                # lone "agence" is weak; drop if that's the only cue in the quote
                if not re.search(r"bureau|ecran|ordinateur|cabinet|classe|open.?space|salle de marche", qf):
                    continue
            out.append((field, q, w))
        return out

    dehors = filtered("dehors")
    atelier = filtered("atelier")
    bureau = filtered("bureau")
    terrain = filtered("terrain")

    # "a domicile" as one's own practice (shiatsu, assistante maternelle) is indoor, not terrain
    terrain_f = []
    for e in terrain:
        qf, _, _ = fold_map(clean_raw(e[1]))
        # "exerce a son domicile" without visiting clients → skip as terrain
        if re.search(r"(exerce|exercer|activite) .{0,40}(a |dans )son domicile", qf) and not re.search(
            r"chez (le|les|son) client|visites a domicile|au domicile des", qf
        ):
            bureau.append((e[0], e[1], max(1, e[2] - 1)))
            continue
        terrain_f.append(e)
    terrain = terrain_f

    w_d = sum(x[2] for x in dehors)
    w_a = sum(x[2] for x in atelier)
    w_b = sum(x[2] for x in bureau)
    w_t = sum(x[2] for x in terrain)
    debug["weights"] = {"dehors": w_d, "atelier": w_a, "bureau": w_b, "terrain": w_t}

    present = []
    if w_d >= 2:
        present.append(("dehors", w_d, dehors))
    if w_a >= 2:
        present.append(("atelier-chantier", w_a, atelier))
    if w_b >= 2:
        present.append(("bureau", w_b, bureau))

    # terrain + bureau => mixte
    # dehors + bureau/atelier => mixte
    # atelier + bureau => mixte (ingénieur bureau + usine)
    value, conf, just, source_groups = INCONNU, CONF_F, "", []

    physical = (w_d >= 2) + (w_a >= 2)
    indoor_desk = w_b >= 2
    has_field_work = w_t >= 4  # frequent/explicit terrain only; occasional travel is not enough

    # Explicit mixed-workplace sentences take precedence
    explicit_mix_pats = [
        r"a l'exterieur ou derriere",
        r"exterieur ou derriere son ecran",
        r"au bureau .{0,40}sur le terrain",
        r"en laboratoire plus qu'en mer",
        r"peu de temps en mer",
        r"plus de temps en laboratoire que sur le terrain",
        r"partage (son temps|son temps de travail) entre le bureau et le terrain",
        r"tantot .{0,30}tantot",
        r"en studio ou en exterieur",
        r"en salle ou en exterieur",
        r"en laboratoire que sur le terrain",
        r"entre le bureau et le terrain",
        r"au bureau et sur le terrain",
    ]
    for field, original, mmap, folded in blobs:
        for pat in explicit_mix_pats:
            for q, *_ in search(folded, mmap, original, pat):
                return "mixte", CONF_H, q, {"explicit_mix": pat}

    if len(present) >= 2 or (indoor_desk and (w_d >= 2 or w_a >= 2 or has_field_work)):
        value = "mixte"
        quotes = []
        for _, _, entries in present:
            q = best_quote(entries)
            if q:
                quotes.append(q)
        if has_field_work and not quotes:
            quotes.append(best_quote(terrain) or "")
        if has_field_work and indoor_desk:
            tq = best_quote(terrain)
            bq = best_quote(bureau)
            just = " / ".join([x for x in (bq, tq) if x])
        else:
            just = " / ".join(quotes[:2])
        total = w_d + w_a + w_b + (w_t if has_field_work else 0)
        conf = conf_from_weight(total, haute=8, moyenne=4)
        # explicit mix in one sentence
        for field, original, mmap, folded in blobs:
            for pat in [
                r"a l'exterieur ou derriere",
                r"exterieur ou derriere son ecran",
                r"au bureau .{0,40}sur le terrain",
                r"en laboratoire plus qu'en mer",
                r"peu de temps en mer",
                r"plus de temps en laboratoire que sur le terrain",
                r"partage (son temps|son temps de travail) entre le bureau et le terrain",
                        r"tantot .{0,30}tantot",
                r"en studio ou en exterieur",
                r"en salle ou en exterieur",
            ]:
                for q, *_ in search(folded, mmap, original, pat):
                    just = q
                    conf = CONF_H
                    break
    elif len(present) == 1:
        value = present[0][0]
        just = best_quote(present[0][2]) or ""
        conf = conf_from_weight(present[0][1], haute=5, moyenne=3)
    elif w_t >= 5 and w_b < 2 and w_d < 2 and w_a < 2:
        # only strong field visits, no workplace type
        value = "mixte"
        just = best_quote(terrain) or ""
        conf = CONF_F
    elif w_b == 1 or w_d == 1 or w_a == 1:
        # weak single signal
        tag, entries, w = (
            ("bureau", bureau, w_b)
            if w_b >= w_d and w_b >= w_a
            else ("dehors", dehors, w_d)
            if w_d >= w_a
            else ("atelier-chantier", atelier, w_a)
        )
        if w >= 1 and entries:
            value = tag
            just = best_quote(entries) or ""
            conf = CONF_F
    else:
        # last-resort activity inference (faible only)
        all_fold = " ".join(b[3] for b in blobs)
        if re.search(r"lignes de code|devant (son |un )(ecran|ordinateur)|derriere (son |un )ecran", all_fold):
            q = first_quote(blobs, [r"lignes de code", r"devant (son |un )(ecran|ordinateur)", r"derriere (son |un )ecran"])
            if q:
                value = "bureau"
                just = q
                conf = CONF_F
                debug["inferred_from_activity"] = True

    return value, conf, just, debug


def classify_teletravail(row, blobs, lieu_val, lieu_conf, lieu_just):
    debug = {}
    explicit = []
    for field, original, mmap, folded in blobs:
        for pat in TT_EXPLICIT_POSSIBLE + TT_EXPLICIT_PARTIEL + TT_EXPLICIT_POSSIBLE_BROAD:
            for q, a, b, mt in search(folded, mmap, original, pat):
                # map a back... we have quote; check false context via folded around match
                # find match pos
                for m in re.finditer(pat, folded):
                    if is_false_tt_context(folded, m.start(), m.end()):
                        debug.setdefault("false_positives", []).append(q)
                        continue
                    explicit.append((field, q, pat, m.group(0)))
                    break
    # unique quotes
    seen = set()
    expl2 = []
    for e in explicit:
        if e[1] in seen:
            continue
        seen.add(e[1])
        expl2.append(e)
    explicit = expl2

    # Drop purely prospective mentions ("à terme, le travail à distance devrait…")
    explicit = [
        e for e in explicit
        if not re.search(r"devrait limiter|a terme.{0,60}a distance", fold_map(clean_raw(e[1]))[0])
    ]

    if explicit:
        textjoin = " ".join(fold_map(clean_raw(e[1]))[0] for e in explicit)
        # expert bilan carbone style already filtered
        partiel = bool(
            re.search(
                r"partiel|ponctuel|au moins en partie|ou sur site|sur site ou|presentiel|parfois|jours de teletravail",
                textjoin,
            )
        )
        value = "partiel" if partiel else "possible"
        # "principalement a distance" without on-site → possible
        if re.search(r"principalement a distance|activite principale se deroule a distance", textjoin) and not re.search(
            r"presentiel|sur site", textjoin
        ):
            value = "possible"
        just = explicit[0][1]
        conf = CONF_H if re.search(r"teletravail", textjoin) else CONF_M
        return value, conf, just, debug

    # inference from workplace: presence physically required
    if lieu_val in ("dehors", "atelier-chantier") and lieu_conf in (CONF_H, CONF_M):
        return "non", CONF_M if lieu_conf == CONF_H else CONF_F, lieu_just, {"inferred_from_lieu": lieu_val}
    if lieu_val == "mixte" and lieu_conf in (CONF_H, CONF_M):
        # physical mix often cannot be fully remote; still not always "non"
        # only if a strong on-site component (dehors/atelier/soins/classe)
        all_fold = " ".join(b[3] for b in blobs)
        if re.search(
            r"en mer|en montagne|dehors|chantier|fournil|cuisine|hopital|patients|visites a domicile|"
            r"exploitation agricole|a l'exterieur|par tous les temps|"
            r"effectuent des gardes|sapeurs-pompiers|intervention sur le terrain|"
            r"passe peu de temps en mer|en laboratoire plus qu'en mer",
            all_fold,
        ):
            q = lieu_just or first_quote(
                blobs,
                [
                    r"par tous les temps",
                    r"a l'exterieur",
                    r"\bchantiers?\b",
                    r"visites a domicile",
                    r"\ben mer\b",
                    r"en laboratoire",
                ],
            )
            return "non", CONF_F, q or lieu_just, {"inferred_from_mixte": True}

    # strong on-site care / teaching / driving even if lieu failed
    all_fold = " ".join(b[3] for b in blobs)
    onsite = [
        (r"examen clinique", "non"),
        (r"24 heures?(/| sur )?24", "non"),
        (r"en classe\b", "non"),
        (r"devant la classe", "non"),
        (r"au chevet", "non"),
        (r"derriere le four|au fournil", "non"),
        (r"conducteur|conduis(e|t)|au volant", "non"),
        (r"effectuent des gardes", "non"),
        (r"gardes de 12 ou 24", "non"),
        (r"sapeurs-pompiers", "non"),
    ]
    for pat, _ in onsite:
        if re.search(pat, all_fold):
            q = first_quote(blobs, [pat])
            conf = CONF_M if pat not in (r"conducteur|conduis(e|t)|au volant",) else CONF_F
            if pat.startswith("conducteur") and not re.search(r"\b(conducteur|au volant|conduisant|conduire un)\b", all_fold):
                continue
            return "non", conf, q or "", {"inferred_onsite_pattern": pat}

    return INCONNU, CONF_F, "", debug


def classify_horaires(row, blobs, hits_unused, statuts):
    debug = {}
    hits = collect_hits(blobs, HOR_DECAL + HOR_VAR + HOR_REG)
    # drop "dans l'urgence" (weight 0 already)
    dec = [e for e in hits.get("decale", []) if e[2] > 0]
    var = [e for e in hits.get("var", []) if e[2] > 0]
    reg = [e for e in hits.get("reg", []) if e[2] > 0]
    w_d = sum(e[2] for e in dec)
    w_v = sum(e[2] for e in var)
    w_r = sum(e[2] for e in reg)
    debug["weights"] = {"decale": w_d, "var": w_v, "reg": w_r}

    # statut saisonnier / intermittent reinforces variables
    if any(s in ("saisonnier", "intermittent du spectacle", "intermittent") for s in (row.get("statuts") or [])):
        w_v += 2
        debug["statut_var"] = True

    if w_d >= 3:
        return "décalés-nuit-week-end", conf_from_weight(w_d, 6, 3), best_quote(dec) or "", debug
    if w_v >= 4 and w_d >= 2:
        # both: prefer décalés if nights/weekends are explicit
        return "décalés-nuit-week-end", conf_from_weight(w_d + w_v, 8, 4), best_quote(dec) or best_quote(var) or "", debug
    if w_v >= 3:
        return "variables", conf_from_weight(w_v, 6, 3), best_quote(var) or "", debug
    if w_d >= 2:
        return "décalés-nuit-week-end", CONF_M if w_d >= 3 else CONF_F, best_quote(dec) or "", debug
    if w_r >= 3:
        return "réguliers", conf_from_weight(w_r, 6, 3), best_quote(reg) or "", debug
    if w_r >= 2:
        return "réguliers", CONF_F, best_quote(reg) or "", debug
    if w_v >= 2:
        return "variables", CONF_F, best_quote(var) or "", debug
    return INCONNU, CONF_F, "", debug


def classify_utilite(row, blobs):
    hits = collect_hits(blobs, UTIL_OUI)
    oui = hits.get("oui", [])
    w = sum(e[2] for e in oui)
    secteurs_list = list(row.get("secteurs") or [])
    secteurs = set(secteurs_list)
    sect_hard = secteurs & OUI_SECTORS
    sect_soft = secteurs & OUI_SECTORS_SOFT

    # Never "non": the fiche does not say a job is socially useless.
    if w >= 3 or (sect_hard and w >= 1):
        conf = CONF_H if (w >= 5 and sect_hard) else CONF_M if (w >= 3 or sect_hard) else CONF_F
        just = best_quote(oui) or (
            "Secteur Onisep : " + ", ".join(sorted(sect_hard)) if sect_hard else ""
        )
        return "oui", conf, just, {"w": w, "sect_hard": list(sect_hard)}
    if sect_hard:
        # Enseignement as a secondary sector of a research job is not enough.
        only_ens = sect_hard == {"Enseignement"} and ("Recherche" in secteurs) and w < 2
        if only_ens:
            just = "Secteur Enseignement présent (souvent via l'université) sans mission d'enseignement explicite ; classement prudent « en partie »."
            return "en partie", CONF_F, just, {"enseignement_secondaire": True}
        return (
            "oui",
            CONF_M if len(sect_hard) >= 1 else CONF_F,
            "Secteur Onisep : " + ", ".join(sorted(sect_hard)) + (f" — {best_quote(oui)}" if oui else ""),
            {"secteur_only": True},
        )
    if w >= 2 or sect_soft:
        just = best_quote(oui) or (
            "Secteur Onisep : " + ", ".join(sorted(sect_soft)) if sect_soft else ""
        )
        # soft sectors without text stay "en partie"
        if w >= 3:
            return "oui", CONF_F, just, {"soft": True}
        return "en partie", CONF_M if sect_soft or w else CONF_F, just, {"soft": True}
    # default cautious
    just = ""
    if secteurs:
        just = "Pas d'utilité sociétale explicite dans la fiche ; classement prudent « en partie » (secteurs : " + ", ".join(secteurs_list[:4]) + ("…" if len(secteurs) > 4 else "") + ")."
    else:
        just = "Pas d'utilité sociétale explicite dans la fiche ; classement prudent « en partie »."
    return "en partie", CONF_F, just, {"default": True}


def classify_sensibilite(row, blobs):
    hits = collect_hits(
        blobs, SENS_FORTE_AUTO + SENS_FORTE_CRISE + SENS_FAIBLE_AUTO + SENS_FAIBLE_CRISE
    )
    fa, fc = hits.get("fa", []), hits.get("fc", [])
    ba, bc = hits.get("ba", []), hits.get("bc", [])
    w_fa, w_fc = sum(e[2] for e in fa), sum(e[2] for e in fc)
    w_ba, w_bc = sum(e[2] for e in ba), sum(e[2] for e in bc)

    # filter weak "robotisation" when the person BUILDS robots
    all_fold = " ".join(b[3] for b in blobs)
    if w_fa and re.search(r"cree des ensembles automatises|concoit .{0,40}robots|met(tre)? au point .{0,20}robots", all_fold):
        # unless hiring is affected
        if not re.search(r"recrutement|effectifs|postes|emplois", " ".join(fold_map(clean_raw(e[1]))[0] for e in fa)):
            w_fa = 0
            fa = []

    statuts = set(row.get("statuts") or [])
    if "saisonnier" in statuts:
        w_fc += 2
    if "intermittent du spectacle" in statuts or "intermittent" in statuts:
        w_fc += 3

    secteurs = set(row.get("secteurs") or [])
    prior_forte = 0
    prior_faible = 0
    prior_just = ""
    if secteurs & CRISE_SECTORS and w_fc == 0 and w_bc == 0:
        prior_forte += 1
        prior_just = "Secteur habituellement exposé à la conjoncture : " + ", ".join(sorted(secteurs & CRISE_SECTORS)) + "."
    if secteurs & AUTO_SECTORS and w_fa == 0 and w_ba == 0:
        prior_forte += 1
        if not prior_just:
            prior_just = "Secteur industriel pouvant être exposé à l'automatisation : " + ", ".join(sorted(secteurs & AUTO_SECTORS)) + "."
    if secteurs & {"Santé", "Enseignement", "Social", "Sécurité", "Défense"} and w_fa + w_fc == 0:
        prior_faible += 1
        if not prior_just:
            prior_just = "Secteur de soin, d'enseignement ou de sécurité, généralement peu sensible à une substitution complète."

    forte = w_fa + w_fc
    faible = w_ba + w_bc

    only_aleas = False
    if fc:
        texts = " ".join(fold_map(clean_raw(e[1]))[0] for e in fc)
        if re.search(r"aleas climatiques", texts) and not re.search(r"saisonniere|precarite|conjoncture|intermittent", texts) and w_fa == 0:
            only_aleas = True
    if only_aleas and forte <= 5:
        return "moyenne", CONF_F, best_quote(fc) or "", {"aleas_only": True}
    if forte >= 4 and forte > faible + 1:
        just = best_quote(fc or fa) or ""
        return "forte", conf_from_weight(forte, 7, 4), just, {"fa": w_fa, "fc": w_fc}
    if faible >= 4 and faible > forte + 1:
        just = best_quote(bc or ba) or ""
        return "faible", conf_from_weight(faible, 7, 4), just, {"ba": w_ba, "bc": w_bc}
    if forte >= 2 and faible >= 2:
        just_parts = [x for x in (best_quote(fc or fa), best_quote(bc or ba)) if x]
        return "moyenne", CONF_M, " / ".join(just_parts), {"mixed": True}
    if forte >= 2:
        return "forte", CONF_M if forte >= 3 else CONF_F, best_quote(fc or fa) or "", {}
    if faible >= 2:
        return "faible", CONF_M if faible >= 3 else CONF_F, best_quote(bc or ba) or "", {}
    if prior_forte and prior_faible:
        return "moyenne", CONF_F, prior_just, {"prior_mixed": True}
    if prior_forte and not (secteurs & {"Santé", "Enseignement", "Social"}):
        return "moyenne", CONF_F, prior_just, {"prior_crise_or_auto": True}
    if prior_faible:
        return "faible", CONF_F, prior_just, {"prior_essaim": True}

    # IT hint: tools reduce programming — moyenne, only if text says so
    if re.search(r"moins de programmation|outils de developpement facilitent|intelligence artificielle", all_fold):
        q = first_quote(
            blobs,
            [
                r"moins de programmation",
                r"outils de developpement facilitent",
                r"intelligence artificielle",
            ],
        )
        # IA as tool without replacement → moyenne or faible
        if re.search(r"sans remplacer", all_fold):
            return "faible", CONF_M, q or "", {"ia_aide": True}
        if re.search(r"moins de programmation|facilitent l'ecriture", all_fold):
            return "moyenne", CONF_F, q or "", {"outils": True}

    return INCONNU, CONF_F, "", {"no_signal": True}


def classify_geo(row, blobs, nom: str):
    hits = collect_hits(blobs, GEO_FORTE + GEO_FAIBLE)
    gfor, gfai = hits.get("gfor", []), hits.get("gfai", [])
    # filter false mer / montagne in passing
    def ok_forte(e):
        qf, _, _ = fold_map(clean_raw(e[1]))
        if re.search(r"\bmassifs?\b", qf) and not re.search(r"montagne|randonnee|sentier|refuge|alpes|pyrenees", qf):
            return False
        # "à bord d'un véhicule / d'une nacelle / d'un train" is not a geographic tie
        if re.search(r"a bord d'(un |une )?(vehicule|nacelle|helicoptere|train|avion|rame|vsl|camion|bolide)", qf) and not re.search(r"\ben mer\b|navire|bateau|offshore|montagne", qf):
            return False
        if re.search(r"par exemple (dans les )?stations de ski|l'hiver dans une station de ski", qf) and not re.search(r"exerce (en|surtout|principalement) (montagne|station)", qf):
            return False
        if re.search(r"(lauze|tuiles|ardoise|toiture).{0,30}en montagne|en montagne, de tuiles", qf):
            return False
        if re.search(r"securite des activites en mer|volcans d'auvergne", qf) and not re.search(r"sur le terrain.{0,20}volcan|exerce en mer", qf):
            return False
        if re.search(r"electronique embarquee|informatique embarquee", qf):
            return False
        if re.search(r"en montagne, dans les pres ou|ruches \(en montagne", qf):
            return False
        if re.search(r"chaudiere d'une centrale nucleaire|cuve d'une usine", qf) and not re.search(r"en centrale nucleaire|poste[s]? en centrale", qf):
            return False
        if re.search(r"saisonnier.{0,50}station[s]? de ski|station[s]? de ski.{0,40}bord de la mer|contrat saisonnier, (en station|dans les stations)", qf):
            return False
        if re.search(r"sauveteurs en montagne|sorties en foret, par exemple|traces de fumee peuvent reveler la presence d'un volcan", qf):
            return False
        return True

    gfor = [e for e in gfor if ok_forte(e)]
    w_for = sum(e[2] for e in gfor)
    w_fai = sum(e[2] for e in gfai)

    # name-based reinforcement only if text also supports (don't invent from name alone)
    nom_f = fold_map(nom)[0]
    name_cue = None
    if re.search(r"montagne|alpin|moniteur de ski|pisteur|guide de (haute )?montagne", nom_f):
        name_cue = "montagne"
    elif re.search(r"oceanologue|oceanographe|marine|off-?shore|marin pecheur|mareyeur|officier(e)? de port", nom_f):
        name_cue = "mer"
    elif re.search(r"volcanologue|forestier|sylviculteur|nucleaire", nom_f):
        name_cue = "site"

    if w_fai >= 3 and w_for < 3:
        return "faible", conf_from_weight(w_fai, 6, 3), best_quote(gfai) or "", {}
    if w_for >= 3:
        # if also "partout en france" (pompiers), prefer faible unless the forte is mer/montagne/nucleaire
        quotes = " ".join(fold_map(clean_raw(e[1]))[0] for e in gfor)
        essential_place = bool(re.search(r"montagne|en mer|off-?shore|nucleaire|volcan|foret|plateforme", quotes))
        if w_fai >= 3 and not essential_place:
            return "faible", conf_from_weight(w_fai, 6, 3), best_quote(gfai) or "", {"overridden_by_territoire": True}
        return "forte", conf_from_weight(w_for, 6, 3), best_quote(gfor) or "", {}
    if w_for >= 2 or (name_cue and w_for >= 1):
        return "forte", CONF_M if w_for >= 2 else CONF_F, best_quote(gfor) or "", {"name_cue": name_cue}
    if w_fai >= 2:
        return "faible", CONF_M if w_fai >= 3 else CONF_F, best_quote(gfai) or "", {}

    # no specific place constraint mentioned
    return "faible", CONF_F, "Aucune attache à un lieu précis (mer, montagne, site particulier, grandes villes seulement…) n'est mentionnée dans la fiche.", {"default_faible": True}


def enrich_one(row: dict) -> dict:
    all_blobs, blobs_lieu, blobs_geo, blobs_sens, used_primary = prepare(row)
    hits_lieu = collect_hits(blobs_lieu, LIEU_PATTERNS)

    lieu, lieu_c, lieu_j, d_lieu = classify_lieu(row, blobs_lieu, hits_lieu)
    tt, tt_c, tt_j, d_tt = classify_teletravail(row, blobs_lieu, lieu, lieu_c, lieu_j)
    hor, hor_c, hor_j, d_hor = classify_horaires(row, blobs_lieu, None, row.get("statuts"))
    uti, uti_c, uti_j, d_uti = classify_utilite(row, blobs_sens)
    sen, sen_c, sen_j, d_sen = classify_sensibilite(row, blobs_sens)
    geo, geo_c, geo_j, d_geo = classify_geo(row, blobs_geo, row.get("nom") or "")

    # If value is inconnu, clear justification or keep empty; confidence not meaningful — still store faible
    def pack(val, conf, just):
        if val == INCONNU:
            return val, "", ""  # no fake confidence
        return val, conf, just

    lieu, lieu_c, lieu_j = pack(lieu, lieu_c, lieu_j)
    tt, tt_c, tt_j = pack(tt, tt_c, tt_j)
    hor, hor_c, hor_j = pack(hor, hor_c, hor_j)
    uti, uti_c, uti_j = pack(uti, uti_c, uti_j)
    sen, sen_c, sen_j = pack(sen, sen_c, sen_j)
    geo, geo_c, geo_j = pack(geo, geo_c, geo_j)

    rec = {
        "identifiant": row["identifiant"],
        "nom": row["nom"],
        "secteurs": row.get("secteurs") or [],
        "statuts": row.get("statuts") or [],
        "texte_long_disponible": used_primary,
        "lieu": lieu,
        "lieu_justification": lieu_j,
        "lieu_confiance": lieu_c,
        "teletravail": tt,
        "teletravail_justification": tt_j,
        "teletravail_confiance": tt_c,
        "horaires": hor,
        "horaires_justification": hor_j,
        "horaires_confiance": hor_c,
        "utilite": uti,
        "utilite_justification": uti_j,
        "utilite_confiance": uti_c,
        "sensibilite": sen,
        "sensibilite_justification": sen_j,
        "sensibilite_confiance": sen_c,
        "contrainte_geo": geo,
        "contrainte_geo_justification": geo_j,
        "contrainte_geo_confiance": geo_c,
    }
    debug = {
        "identifiant": row["identifiant"],
        "nom": row["nom"],
        "lieu": d_lieu,
        "teletravail": d_tt,
        "horaires": d_hor,
        "utilite": d_uti,
        "sensibilite": d_sen,
        "contrainte_geo": d_geo,
    }
    return rec, debug


def main():
    rows = json.loads(SRC.read_text(encoding="utf-8"))
    out = []
    debugs = []
    for row in rows:
        rec, dbg = enrich_one(row)
        out.append(rec)
        debugs.append(dbg)

    OUT_JSON.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    # slim debug (no huge dumps)
    OUT_DEBUG.write_text(json.dumps(debugs, ensure_ascii=False), encoding="utf-8")

    fields = [
        "identifiant",
        "nom",
        "texte_long_disponible",
        "lieu",
        "lieu_justification",
        "lieu_confiance",
        "teletravail",
        "teletravail_justification",
        "teletravail_confiance",
        "horaires",
        "horaires_justification",
        "horaires_confiance",
        "utilite",
        "utilite_justification",
        "utilite_confiance",
        "sensibilite",
        "sensibilite_justification",
        "sensibilite_confiance",
        "contrainte_geo",
        "contrainte_geo_justification",
        "contrainte_geo_confiance",
        "secteurs",
        "statuts",
    ]
    with OUT_CSV.open("w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields, delimiter=";", extrasaction="ignore")
        w.writeheader()
        for rec in out:
            row = dict(rec)
            row["secteurs"] = " | ".join(rec["secteurs"])
            row["statuts"] = " | ".join(rec["statuts"])
            row["texte_long_disponible"] = "oui" if rec["texte_long_disponible"] else "non"
            w.writerow(row)

    # coverage report
    crits = [
        ("lieu", "lieu"),
        ("teletravail", "teletravail"),
        ("horaires", "horaires"),
        ("utilite", "utilite"),
        ("sensibilite", "sensibilite"),
        ("contrainte_geo", "contrainte_geo"),
    ]
    print(f"n={len(out)}")
    for name, key in crits:
        vals = [r[key] for r in out]
        known = sum(v != INCONNU for v in vals)
        print(f"\n== {name}: {known}/{len(out)} renseignés, {len(out)-known} inconnu")
        from collections import Counter

        print("  valeurs", Counter(vals))
        confs = Counter(r[f"{key}_confiance"] for r in out if r[key] != INCONNU)
        print("  confiance", confs)

    print("wrote", OUT_CSV, OUT_JSON)


if __name__ == "__main__":
    main()
