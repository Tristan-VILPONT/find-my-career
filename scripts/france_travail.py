#!/usr/bin/env python3
"""Phase 2 : données France Travail (ROME 4.0, BMO 2026) et critères de la grille.

Lit uniquement des fichiers open data officiels rangés dans data/source/france-travail/ :

- rome-4.0-v462-json.zip : « Toutes les données du ROME » (ROME 4.0 v462, 19/10/2026), Licence Ouverte
- Base-open-data-BMO-2026.xlsx : enquête Besoins en Main-d'Œuvre 2026, Licence Ouverte
- Dares_FAP2021_Table_passage_ROME.xlsx : table de passage FAP-2021 ↔ ROME (Dares)

et le CSV Onisep (codes ROME par fiche), le XML Onisep et enrichi.json.
Écrit data/source/grille.json (une entrée par métier Onisep).

Aucun chiffre n'est inventé : les projets de recrutement et la part de projets
difficiles sont des sommes des lignes publiées par bassin d'emploi (les cases
masquées « * » pour secret statistique ne sont pas comptées). Les critères de la
grille (E/T/P, investisseur, temps libre, santé) sont des déductions : chaque
valeur porte un drapeau « haute » quand elle repose sur un champ explicite
(statut Onisep, contexte de travail du ROME, phrase claire de la fiche), sinon
le site l'affiche « (estimation) ».
"""

from __future__ import annotations

import csv
import hashlib
import json
import re
import sys
import zipfile
from collections import defaultdict
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from onisep_parse import SOURCE_CSV, SOURCE_ENRICHI, SOURCE_ZIP, parse_metiers, read_xml_bytes  # noqa: E402

FT = ROOT / "data" / "source" / "france-travail"
ROME_ZIP = FT / "rome-4.0-v462-json.zip"
BMO_XLSX = FT / "Base-open-data-BMO-2026.xlsx"
FAP_XLSX = FT / "Dares_FAP2021_Table_passage_ROME.xlsx"
OUT = ROOT / "data" / "source" / "grille.json"

SOURCES = {
    "rome": {
        "label": "ROME 4.0 (version 62, octobre 2026) – France Travail",
        "annee": "2026",
        "url": "https://www.data.gouv.fr/datasets/repertoire-operationnel-des-metiers-et-des-emplois-rome",
        "licence": "Licence Ouverte",
    },
    "bmo": {
        "label": "Enquête Besoins en Main-d'Œuvre (BMO) 2026 – France Travail",
        "annee": "2026",
        "url": "https://www.data.gouv.fr/datasets/enquete-besoins-en-main-doeuvre-bmo",
        "licence": "Licence Ouverte",
    },
    "fap": {
        "label": "Table de passage FAP-2021 / ROME – Dares",
        "annee": "2023",
        "url": "https://www.data.gouv.fr/datasets/la-nomenclature-des-familles-professionnelles-2021",
        "licence": "Dares",
    },
}

ROME_RE = re.compile(r"\b[A-N]\d{4}\b")


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


# ---------------------------------------------------------------- sources

def load_rome() -> dict[str, dict]:
    with zipfile.ZipFile(ROME_ZIP) as archive:
        name = next(n for n in archive.namelist() if "fiche_emploi_metier" in n)
        raw = archive.read(name).decode("cp1252")
    fiches = {}
    for fiche in json.loads(raw):
        code = fiche["rome"]["code_rome"]
        ctx: dict[str, set[str]] = defaultdict(set)
        for group in fiche.get("contextes_travail") or []:
            for item in group.get("items") or []:
                ctx[group["libelle"]].add(item["libelle"])
        savoir_faire = set()
        for enjeu in (fiche.get("competences") or {}).get("savoir_faire", {}).get("enjeux", []) or []:
            for item in enjeu.get("items") or []:
                savoir_faire.add(item["libelle"])
        fiches[code] = {"intitule": fiche["rome"]["intitule"], "ctx": ctx, "sf": savoir_faire}
    return fiches


def load_onisep_rome() -> dict[str, list[str]]:
    out: dict[str, list[str]] = {}
    with SOURCE_CSV.open(encoding="utf-8-sig", newline="") as handle:
        for row in csv.DictReader(handle, delimiter=";"):
            match = re.search(r"MET\.(\d+)", row.get("lien site onisep.fr") or "")
            if not match:
                continue
            codes = ROME_RE.findall(row.get("code ROME") or "")
            if codes and match.group(1) not in out:
                out[match.group(1)] = list(dict.fromkeys(codes))
    return out


def load_fap() -> dict[str, list[tuple[str, str | None]]]:
    wb = openpyxl.load_workbook(FAP_XLSX, read_only=True)
    ws = wb["FAP_ROME_niveau_FAP341"]
    out: dict[str, list[tuple[str, str | None]]] = defaultdict(list)
    for fap, _lib, rome, qualif, _ in list(ws.iter_rows(values_only=True))[1:]:
        if fap and rome:
            out[str(rome)].append((str(fap)[:5], qualif))
    return out


def load_bmo() -> tuple[dict[str, dict], dict]:
    wb = openpyxl.load_workbook(BMO_XLSX, read_only=True)
    ws = wb["BMO_2026_open_data"]
    agg: dict[str, dict] = {}

    def num(value):
        try:
            return int(value)
        except (TypeError, ValueError):
            return None

    for row in list(ws.iter_rows(values_only=True))[1:]:
        code, nom = row[1], row[2]
        entry = agg.setdefault(code, {"nom": nom, "met": 0, "xmet": 0, "xbase": 0, "smet": 0, "sbase": 0})
        met, xmet, smet = num(row[12]), num(row[13]), num(row[14])
        if met is None:
            continue
        entry["met"] += met
        if xmet is not None:
            entry["xmet"] += xmet
            entry["xbase"] += met
        if smet is not None:
            entry["smet"] += smet
            entry["sbase"] += met
    total = sum(e["met"] for e in agg.values())
    xt = sum(e["xmet"] for e in agg.values())
    xb = sum(e["xbase"] for e in agg.values())
    return agg, {"projets": total, "difficiles_pct": round(100 * xt / xb) if xb else None}


# ---------------------------------------------------------------- helpers

def fold(text: str) -> str:
    return re.sub(r"\s+", " ", text.lower().replace("’", "'"))


def any_in(text: str, words) -> list[str]:
    return [w for w in words if w in text]


def years_after_3e(niveau_label: str) -> int:
    table = {
        "CAP ou équivalent + 1 an": 2, "3e": 0, "diplôme national du brevet": 0, "bac + 5": 8, "bac + 2": 5,
        "bac ou équivalent": 3, "CAP ou équivalent": 1, "sans diplôme": 0, "autre formation": 3, "bac + 1": 4,
        "bac + 3": 6, "bac + 4": 7, "bac + 6": 9, "bac + 7": 10, "bac + 8": 11, "bac + 9 et plus": 12,
    }
    return table.get(niveau_label, 3)


NIVEAUX = [
    "CAP ou équivalent + 1 an", "3e", "diplôme national du brevet", "bac + 5", "bac + 2", "bac ou équivalent",
    "CAP ou équivalent", "sans diplôme", "autre formation", "bac + 1", "bac + 3", "bac + 4", "bac + 6", "bac + 7",
    "bac + 8", "bac + 9 et plus",
]


def faps_for(codes: list[str], fap: dict, niveau_idx: int) -> list[str]:
    years = years_after_3e(NIVEAUX[niveau_idx] if 0 <= niveau_idx < len(NIVEAUX) else "")
    if years >= 8:
        prefs = ["9", "8", "7"]
    elif years >= 5:
        prefs = ["7", "8", "6", "3"]
    else:
        prefs = ["6", "3", "0", "4", "5", "2"]
    out: list[str] = []
    for code in codes:
        rows = fap.get(code) or []
        if not rows:
            continue
        chosen = None
        for pref in prefs:
            for fcode, qualif in rows:
                if qualif is None or pref in qualif.replace("Q_", ""):
                    chosen = fcode
                    break
            if chosen:
                break
        chosen = chosen or rows[0][0]
        if chosen not in out:
            out.append(chosen)
    return out


# ---------------------------------------------------------------- critères

SALARIE_ONISEP = {"salarié", "fonctionnaire", "militaire", "intermittent du spectacle", "saisonnier", "contrat de volontariat"}
INDEP_ONISEP = {"indépendant", "artisan", "libéral"}
SALARIE_ROME = {"Salarié secteur privé (CDI, CDD)", "Salarié secteur public", "Fonctionnaire", "Militaire", "Intérim", "Contrat intermittent", "Contrat travail saisonnier", "Alternance"}
INDEP_ROME = {"Travailleur indépendant", "Profession libérale", "Artiste-auteur"}

T_PHRASES = [
    "à son compte", "a son compte", "en indépendant", "en tant qu'indépendant", "travailleur indépendant", "travailleuse indépendante",
    "freelance", "free-lance", "en libéral", "exercice libéral", "profession libérale", "auto-entrepreneur", "micro-entrepreneur",
    "s'installer en libéral", "installé en libéral", "installée en libéral", "à leur compte",
]
P_PHRASES = [
    "créer son entreprise", "créer sa propre entreprise", "créer sa société", "créer son propre", "créer sa propre",
    "monter son entreprise", "monter sa propre", "monter son affaire", "monter sa société", "reprendre une entreprise",
    "reprendre une exploitation", "reprendre l'exploitation", "reprise d'entreprise", "reprendre un commerce", "reprendre une affaire",
    "chef d'entreprise", "cheffe d'entreprise", "ouvrir son propre", "ouvrir sa propre", "ouvrir son cabinet", "ouvrir son salon",
    "ouvrir son restaurant", "ouvrir sa boutique", "ouvrir son atelier", "ouvrir son agence", "ouvrir son commerce", "créer son agence",
    "créer son atelier", "créer son cabinet", "créer son salon", "à la tête de sa propre", "diriger sa propre",
    "création d'entreprise", "créer leur entreprise", "créer leur propre",
]
P_SAVOIR_FAIRE = {
    "Diriger et gérer un ensemble, une structure, une organisation",
    "Assurer la gestion administrative et financière d'une activité",
    "Assurer la gestion administrative d'une activité",
    "Développer un portefeuille clients et prospects",
    "Prospecter de nouveaux clients, de nouveaux marchés",
    "Elaborer une stratégie commerciale",
}


def critere_etp(statuts: set[str], ctx: dict, texte: str, sf: set[str]):
    statut_rome = ctx.get("Statut d'emploi", set())
    # E
    if statuts & SALARIE_ONISEP or statut_rome & SALARIE_ROME:
        e, eh = 1, True
    elif statuts and statuts <= INDEP_ONISEP:
        e, eh = 2, False
    else:
        e, eh = 1, False
    # T
    t_phrase = any_in(texte, T_PHRASES)
    fonction_publique_seule = statuts and statuts <= {"fonctionnaire", "militaire"} and not statut_rome & INDEP_ROME
    if statuts & INDEP_ONISEP or statut_rome & INDEP_ROME or "Cabinet libéral" in ctx.get("Types de structures", set()):
        t, th = 1, True
    elif t_phrase:
        t, th = 1, True
    elif fonction_publique_seule:
        t, th = 3, False
    else:
        t, th = 3, False
    # P
    p_phrase = any_in(texte, P_PHRASES)
    if "artisan" in statuts or p_phrase:
        p, ph = 1, True
    elif t == 1 and (sf & P_SAVOIR_FAIRE or statuts & {"libéral", "indépendant"}):
        p, ph = 2, False
    elif t == 1:
        p, ph = 2, False
    else:
        p, ph = 3, False
    preuves = []
    if p_phrase:
        preuves.append(f"la fiche Onisep parle de « {p_phrase[0]} »")
    elif t_phrase and not (statuts & INDEP_ONISEP):
        preuves.append(f"la fiche Onisep parle de « {t_phrase[0]} »")
    return [e, t, p], (1 if eh else 0) | (2 if th else 0) | (4 if ph else 0), preuves


INV_FORT_SECTEURS = {"Banque - Assurances", "Immobilier"}
INV_FORT_MOTS = [
    "gestion de patrimoine", "conseil en patrimoine", "patrimoine financier", "placements financiers", "placement financier", "produits financiers", "marchés financiers", "bourse", "trader",
    "gestion de fortune", "investisseur", "investisseurs", "transactions immobilières", "biens immobiliers", "fiscalité",
    "cryptomonnaie", "crypto-actifs", "actifs financiers", "portefeuille d'actions",
]
INV_AVANTAGE_SECTEURS = {"Bâtiment et travaux publics (BTP)", "Architecture urbanisme paysage", "Comptabilité, gestion, ressources humaines", "Audit - Conseil", "Droit et justice"}
INV_AVANTAGE_SF = {"Négocier des conditions commerciales", "Elaborer, suivre et piloter un budget", "Assurer la gestion administrative et financière d'une activité"}
IDX_AFFAIRES, IDX_CHIFFRES, IDX_RENOVER = 16, 13, 29


def critere_invest(secteurs: set[str], interets_mask: int, nom: str, texte: str, sf: set[str], etp: list[int]):
    nom_f = fold(nom)
    mots = any_in(texte, INV_FORT_MOTS)
    nom_fort = any(w in nom_f for w in ("patrimoine", "financ", "immobili", "notaire", "trader", "banc", "banqu", "fiscal", "actuaire", "assurance", "portefeuille", "crédit", "courtier", "fonds d'investissement", "fusion-acquisition", "syndic")) and "qualité" not in nom_f and "du patrimoine" not in nom_f
    if nom_fort or (secteurs & INV_FORT_SECTEURS and mots) or len(mots) >= 2:
        return 1, "connaissances utiles en finance, immobilier ou patrimoine"
    reasons = []
    if secteurs & {"Bâtiment et travaux publics (BTP)", "Architecture urbanisme paysage"}:
        reasons.append("savoir construire ou rénover (utile pour l'immobilier)")
    if secteurs & {"Comptabilité, gestion, ressources humaines", "Audit - Conseil", "Droit et justice"}:
        reasons.append("gérer un budget, des chiffres ou des contrats")
    if (interets_mask >> IDX_AFFAIRES) & 1:
        reasons.append("sens des affaires et de la négociation")
    if etp[2] == 1:
        reasons.append("peut mener à posséder son entreprise")
    if reasons:
        return 2, " ; ".join(reasons[:2])
    return 3, ""


TL_POIDS = {
    "Travail de nuit": (2, "nuit"),
    "Travail les week-ends et jours fériés": (2, "week-ends et jours fériés"),
    "Travail le dimanche": (1.5, "dimanche"),
    "Travail le samedi": (1, "samedi"),
    "Travail en astreinte": (2, "astreintes"),
    "Mobilisable en urgence": (2, "appels en urgence"),
    "Travail posté (2x8, 3x8, 5x8, etc.)": (1.5, "travail posté (3x8…)"),
    "Travail par roulement": (1, "roulement"),
    "Travail en horaires décalés": (1.5, "horaires décalés"),
    "Travail en horaires fractionnés": (1, "horaires coupés"),
    "Travail selon un rythme irrégulier et des pics d'activité": (1, "pics d'activité"),
    "Travail saisonnier": (1, "saisons"),
}
TL_LIEUX = {"Déplacements professionnels": (1, "déplacements"), "Zone internationale": (1, "déplacements à l'étranger"), "Zone nationale": (0.5, "déplacements en France")}
TL_MOTS = {
    "astreinte": (2, "astreintes"), "de garde": (1.5, "gardes"), "gardes": (1.5, "gardes"), "la nuit": (1.5, "nuit"),
    "week-end": (1.5, "week-ends"), "jours fériés": (1, "jours fériés"), "horaires décalés": (1.5, "horaires décalés"),
    "horaires irréguliers": (1, "horaires irréguliers"), "déplacements fréquents": (1, "déplacements"), "longues journées": (1, "longues journées"),
    "disponibilité": (0.5, "grande disponibilité"),
}


def critere_temps_libre(ctx: dict, hor_onisep: str, hor_haute: bool, texte: str):
    horaires = ctx.get("Horaires et durée du travail", set())
    lieux = ctx.get("Lieux et déplacements", set()) | ctx.get("Conditions de travail et risques professionnels", set())
    score, details = 0.0, []
    for key, (w, label) in TL_POIDS.items():
        if key in horaires:
            score += w
            details.append(label)
    for key, (w, label) in TL_LIEUX.items():
        if key in lieux:
            score += w
            details.append(label)
    if "Travail en horaires fixes" in horaires:
        score -= 1
    if "Travail en journée" in horaires:
        score -= 0.5
    if horaires:
        level = 1 if score <= 1 else 2 if score <= 3 else 3
        return level, True, details
    # Pas de contexte ROME : on lit l'Onisep (estimation).
    score = 0.0
    for key, (w, label) in TL_MOTS.items():
        if key in texte and label not in details:
            score += w
            details.append(label)
    if hor_onisep == "décalés-nuit-week-end":
        score = max(score, 3.5)
    elif hor_onisep == "variables":
        score = max(score, 2)
    elif hor_onisep == "réguliers":
        score = min(score, 1)
    if hor_onisep in ("inconnu", "") and not details:
        return 0, False, []
    level = 1 if score <= 1 else 2 if score <= 3 else 3
    return level, False, details


PHY = {
    "Port et manipulation de charges lourdes ou encombrantes": (2, "charges lourdes"),
    "Position pénible": (2, "positions pénibles"),
    "Station debout prolongée": (1, "debout longtemps"),
    "Travail répétitif ou cadence imposée": (1.5, "gestes répétitifs, cadence"),
    "Exposition aux vibrations": (1, "vibrations"),
    "En environnement bruyant": (1, "bruit"),
    "Exposition à de hautes températures": (1, "chaleur"),
    "Exposition à de basses températures": (1, "froid"),
    "En environnement climatique difficile": (1, "intempéries"),
    "Exposition à la poussière": (1, "poussière"),
    "Exposition possible à gaz, aérosol, fumées ...": (1, "fumées, gaz"),
    "En milieu exigu ou confiné": (1, "espaces confinés"),
    "Travail dans des milieux difficiles et exigeants pour l'humain": (1.5, "milieux difficiles"),
    "En environnement humide": (0.5, "humidité"),
    "En extérieur": (0.5, "extérieur"),
}
RISK = {
    "Manipulation de produits à risques": (1.5, "produits à risques"),
    "Manipulation d'un engin, équipement ou outil dangereux": (1.5, "outils ou engins dangereux"),
    "En grande hauteur": (2, "travail en hauteur"),
    "En altitude": (1, "altitude"),
    "Risques de chutes": (1.5, "risque de chute"),
    "En milieu nucléaire": (1.5, "milieu nucléaire"),
    "En milieu hyperbare": (2, "plongée, milieu hyperbare"),
    "Travail dans des environnements hostiles et dangereux": (2, "environnements dangereux"),
    "Port d'arme et de munitions": (2, "port d'arme"),
    "Port de gilet pare-balles": (2, "gilet pare-balles"),
    "En milieu maritime": (1, "en mer"),
    "En milieu aquatique": (1, "milieu aquatique"),
    "En environnement allergène": (0.5, "allergènes"),
    "Port d'équipement de protection individuelle (EPI) : gants, chaussures, casque, protections auditives": (0.5, "équipements de protection"),
}
STRESS_CTX = {
    "En flux tendu": (1.5, "flux tendu"),
    "Mobilisable en urgence": (1.5, "urgences"),
    "Travail selon un rythme irrégulier et des pics d'activité": (1, "pics d'activité"),
    "En bloc opératoire": (1, "bloc opératoire"),
    "En salle d'accouchement": (1, "salle d'accouchement"),
    "Personnes sous main de justice": (1, "public difficile"),
    "Personnes vulnérables": (0.5, "personnes vulnérables"),
    "Travail en autonomie et en situation isolée": (0.5, "travail isolé"),
}
STRESS_MOTS = {
    "stress": "stress", "sous pression": "pression", "la pression": "pression", "urgence": "urgences", "résistance nerveuse": "résistance nerveuse",
    "sang-froid": "sang-froid", "émotionnellement": "charge émotionnelle", "rythme soutenu": "rythme soutenu", "délais serrés": "délais serrés",
}
PHY_MOTS = {
    "port de charges": (2, "charges lourdes"), "charges lourdes": (2, "charges lourdes"), "physiquement": (1.5, "métier physique"),
    "bonne condition physique": (1.5, "métier physique"), "endurance": (1, "endurance"), "debout": (1, "debout longtemps"),
    "intempéries": (1, "intempéries"), "efforts physiques": (1.5, "métier physique"), "pénible": (1, "pénibilité"), "bruit": (0.5, "bruit"),
}
RISK_MOTS = {
    "dangereux": (1.5, "dangers"), "danger": (1, "dangers"), "risques d'accident": (1.5, "risque d'accident"), "toxiques": (1.5, "produits toxiques"),
    "en hauteur": (1.5, "travail en hauteur"), "port d'arme": (2, "port d'arme"), "radioacti": (1.5, "rayonnements"),
}


def level(score: float, lo: float, hi: float) -> int:
    return 1 if score <= lo else 2 if score <= hi else 3


def critere_sante(ctx: dict, texte: str):
    conds = ctx.get("Conditions de travail et risques professionnels", set())
    publics = ctx.get("Publics spécifiques", set())
    horaires = ctx.get("Horaires et durée du travail", set())
    details: list[str] = []
    haute = bool(conds)
    phy = risk = stress = 0.0
    if conds:
        for key, (w, label) in PHY.items():
            if key in conds:
                phy += w
                details.append(label)
        for key, (w, label) in RISK.items():
            if key in conds:
                risk += w
                if w >= 1:
                    details.append(label)
    else:
        for key, (w, label) in PHY_MOTS.items():
            if key in texte and label not in details:
                phy += w
                details.append(label)
        for key, (w, label) in RISK_MOTS.items():
            if key in texte and label not in details:
                risk += w
                details.append(label)
    stress_details = []
    for key, (w, label) in STRESS_CTX.items():
        if key in conds or key in publics or key in horaires:
            stress += w
            stress_details.append(label)
    mots = 0
    for key, label in STRESS_MOTS.items():
        if key in texte and label not in stress_details and mots < 2:
            stress += 1
            mots += 1
            stress_details.append(label)
    lp, lr, ls = level(phy, 1, 3.5), level(risk, 0.5, 2.5), level(stress, 1, 2.5)
    if not conds and phy == 0 and risk == 0 and stress == 0:
        return None
    if lp == 3 or lr == 3:
        glob = 3
    elif lp == 2 or lr == 2 or ls == 3:
        glob = 2
    else:
        glob = 1
    return {"s": glob, "sp": lp, "sr": lr, "ss": ls, "sh": 1 if haute else 0, "sx": details[:5], "sxs": stress_details[:3]}


# ---------------------------------------------------------------- main

def main() -> None:
    rome = load_rome()
    onisep_rome = load_onisep_rome()
    fap = load_fap()
    bmo, bmo_total = load_bmo()
    enrichi = {r["identifiant"].split(".")[-1]: r for r in json.loads(SOURCE_ENRICHI.read_text(encoding="utf-8"))}
    metiers = parse_metiers(read_xml_bytes(SOURCE_ZIP))

    out: dict[str, dict] = {}
    stats = defaultdict(int)
    fap_labels: dict[str, str] = {}
    for m in metiers:
        mid = m["id"]
        codes = [c for c in onisep_rome.get(mid, []) if c in rome]
        texte = fold(" ".join([m["accroche_brute"], m["format_court"], m["nature_travail"], m["condition_travail"], m["vie_professionnelle"], m["acces_metier"]]))
        primary = rome[codes[0]] if codes else {"ctx": {}, "sf": set()}
        # statut : union des fiches ROME (ce sont des possibilités)
        ctx_union: dict[str, set[str]] = defaultdict(set)
        sf_union: set[str] = set()
        for c in codes:
            for k, v in rome[c]["ctx"].items():
                ctx_union[k] |= v
            sf_union |= rome[c]["sf"]
        ctx_statut = {"Statut d'emploi": ctx_union.get("Statut d'emploi", set()), "Types de structures": ctx_union.get("Types de structures", set())}
        statuts = set(m["statut_labels"])
        secteurs = set(m["secteur_labels"])
        etp, etp_h, preuves = critere_etp(statuts, ctx_statut, texte, sf_union)
        inv, inv_r = critere_invest(secteurs, m["interets"], m["nom"], texte, sf_union, etp)
        rec = enrichi.get(mid, {})
        tl, tl_h, tl_x = critere_temps_libre(primary["ctx"], rec.get("horaires", "inconnu"), rec.get("horaires_confiance") == "haute", texte)
        sante = critere_sante(primary["ctx"], texte)

        entry: dict = {"e": etp, "eh": etp_h, "i": inv}
        if preuves:
            entry["ep"] = preuves[0]
        if inv_r:
            entry["ir"] = inv_r
        if codes:
            entry["r"] = codes
            entry["rl"] = [rome[c]["intitule"] for c in codes]
            stats["rome"] += 1
        if tl:
            entry["t"] = tl
            entry["th"] = 1 if tl_h else 0
            if tl_x:
                entry["tx"] = tl_x[:5]
            stats["tl"] += 1
            stats["tl_haute"] += 1 if tl_h else 0
        if sante:
            entry.update(sante)
            stats["sante"] += 1
            stats["sante_haute"] += sante["sh"]
        familles = faps_for(codes, fap, m["niveau"])
        familles = [f for f in familles if f in bmo and bmo[f]["met"] > 0]
        if familles:
            met = sum(bmo[f]["met"] for f in familles)
            xmet = sum(bmo[f]["xmet"] for f in familles)
            xbase = sum(bmo[f]["xbase"] for f in familles)
            smet = sum(bmo[f]["smet"] for f in familles)
            sbase = sum(bmo[f]["sbase"] for f in familles)
            entry["b"] = {
                "p": met,
                "d": round(100 * xmet / xbase) if xbase else None,
                "s": round(100 * smet / sbase) if sbase else None,
                "f": familles,
            }
            for f in familles:
                fap_labels[f] = bmo[f]["nom"]
            stats["bmo"] += 1
        stats["etp_all"] += 1 if etp[0] == 1 and etp[1] == 1 and etp[2] in (1, 2) else 0
        stats["T_oui"] += 1 if etp[1] == 1 else 0
        stats["P_oui"] += 1 if etp[2] == 1 else 0
        stats["inv1"] += 1 if inv == 1 else 0
        stats["inv2"] += 1 if inv == 2 else 0
        out[mid] = entry

    payload = {
        "genere_le": "2026-11-12",
        "sources": SOURCES,
        "empreintes": {p.name: sha(p) for p in (ROME_ZIP, BMO_XLSX, FAP_XLSX)},
        "bmo_national": bmo_total,
        "fap": dict(sorted(fap_labels.items())),
        "metiers": out,
    }
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=0), encoding="utf-8")
    print(f"{len(out)} métiers → {OUT}")
    for k, v in sorted(stats.items()):
        print(f"  {k}: {v}")
    print("  BMO national :", bmo_total)


if __name__ == "__main__":
    main()
