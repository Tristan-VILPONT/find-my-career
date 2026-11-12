"""Parse the Onisep Idéo-Fiches métiers XML into compact quiz rows.

Salary, niveau, statuts, centres d'intérêt and secteurs follow the same
rules as the October 2026 quiz prototype. Enriched criteria are packed
into one integer (unknown = 0, moyenne/faible confidence = not « haute »).
"""

from __future__ import annotations

import hashlib
import html
import re
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE_ZIP = ROOT / "data" / "source" / "fiches-metiers.zip"
SOURCE_CSV = ROOT / "data" / "source" / "ideo-metiers.csv"
SOURCE_ENRICHI = ROOT / "data" / "source" / "enrichi.json"

# Snapshot of the extract shipped with the site (October 2026).
SNAPSHOT_ZIP_SHA256 = "eb04222a504af7626481e38876565ee3e992f5209f8575d10a6ff01a39939bc8"

NIVEAUX = [
    "CAP ou équivalent + 1 an",
    "3e",
    "diplôme national du brevet",
    "bac + 5",
    "bac + 2",
    "bac ou équivalent",
    "CAP ou équivalent",
    "sans diplôme",
    "autre formation",
    "bac + 1",
    "bac + 3",
    "bac + 4",
    "bac + 6",
    "bac + 7",
    "bac + 8",
    "bac + 9 et plus",
]

STATUTS = [
    "fonctionnaire",
    "artisan",
    "militaire",
    "intermittent du spectacle",
    "indépendant",
    "saisonnier",
    "contrat de volontariat",
    "libéral",
    "salarié",
]

INTERETS = [
    "j'ai le sens du contact",
    "j'aime le sport, l'activité physique",
    "je souhaite protéger et secourir",
    "j'aime la nature",
    "je souhaite protéger la planète",
    "j'aime organiser, planifier",
    "je souhaite prendre soin des autres",
    "je m'intéresse à d'autres cultures",
    "j'aime dessiner",
    "je souhaite enseigner, transmettre",
    "je souhaite m'occuper d'enfants",
    "j'aime les nouvelles technologies",
    "j'aime diriger",
    "j'aime manier les chiffres",
    "j'aime me déplacer, voyager",
    "j'aime m'occuper d'animaux",
    "j'ai le sens des affaires",
    "j'aime faire des découvertes",
    "j'aime le travail manuel",
    "j'aime communiquer, convaincre",
    "j'aime les sensations fortes",
    "j'ai envie de piloter, conduire",
    "j'ai envie de travailler dans les coulisses du spectacle",
    "je suis un / une artiste",
    "j'ai le sens du service public",
    "j'ai le souci du détail",
    "j'aime cuisiner",
    "j'aime jouer avec les mots",
    "je souhaite faire respecter la loi, les règles",
    "j'ai envie de créer, construire, rénover",
]

SECTEURS = [
    "Artisanat d'art",
    "Maintenance",
    "Enseignement",
    "Verre, béton, céramique",
    "Informatique et réseaux",
    "Architecture urbanisme paysage",
    "Hôtellerie - Restauration",
    "Audiovisuel",
    "Défense",
    "Culture - Patrimoine",
    "Logistique et transport",
    "Comptabilité, gestion, ressources humaines",
    "Industrie chimique",
    "Mode et luxe",
    "Recherche",
    "Fonction publique",
    "Sécurité",
    "Énergie",
    "Agroéquipement",
    "Arts du spectacle",
    "Banque - Assurances",
    "Agriculture",
    "Papiers Cartons",
    "Audit - Conseil",
    "Construction aéronautique, ferroviaire et navale",
    "Social",
    "Environnement",
    "Édition, librairie, bibliothèque",
    "Automobile",
    "Filière bois",
    "Électronique",
    "Sport",
    "Bâtiment et travaux publics (BTP)",
    "Marketing, publicité",
    "Commerce et distribution",
    "Droit et justice",
    "Mécanique",
    "Industrie alimentaire",
    "Santé",
    "Tourisme",
    "Services à la personne",
    "Industries",
    "Art et design",
    "Communication",
    "Immobilier",
    "Journalisme",
    "Jeu vidéo",
    "Traduction, interprétation",
]

STATUT_ALIAS = {
    "salarié intermittent du spectacle": "intermittent du spectacle",
}

LIEU_CODE = {"inconnu": 0, "dehors": 1, "bureau": 2, "mixte": 3, "atelier": 4, "atelier-chantier": 4}
TT_CODE = {"inconnu": 0, "oui": 1, "possible": 1, "partiel": 2, "non": 3}
HOR_CODE = {
    "inconnu": 0,
    "réguliers": 1,
    "reguliers": 1,
    "décalés-nuit-week-end": 2,
    "variables": 3,
}
UTI_CODE = {"inconnu": 0, "oui": 1, "en partie": 2, "non": 3}
SEN_CODE = {"inconnu": 0, "faible": 1, "moyenne": 2, "forte": 3}
GEO_CODE = {"inconnu": 0, "faible": 1, "forte": 2}

NUM = r"(\d{1,3}(?:[ \u00a0]\d{3})+|\d{3,6})"


def local(tag: str) -> str:
    return tag.rsplit("}", 1)[-1]


def norm_space(value: str) -> str:
    value = html.unescape(value or "")
    value = value.replace("\xa0", " ").replace("\u202f", " ").replace("\u2009", " ")
    value = value.replace("’", "'").replace("‘", "'")
    value = value.replace("–", "-").replace("—", "-")
    return re.sub(r"\s+", " ", value).strip()


def html_to_text(value: str) -> str:
    if not value:
        return ""
    value = re.sub(r"<!\[CDATA\[", "", value)
    value = re.sub(r"\]\]>", "", value)
    value = re.sub(r"<br\s*/?>", " ", value, flags=re.I)
    value = re.sub(r"</(p|h\d|li|div)>", " ", value, flags=re.I)
    value = re.sub(r"<[^>]+>", " ", value)
    return norm_space(value)


def child_text(element: ET.Element | None, name: str) -> str:
    if element is None:
        return ""
    for node in element:
        if local(node.tag) == name:
            return node.text or ""
    return ""


def grouped_labels(element: ET.Element | None, item_name: str) -> list[str]:
    if element is None:
        return []
    labels: list[str] = []
    for node in element:
        if local(node.tag) != item_name:
            continue
        for sub in node.iter():
            if local(sub.tag) == "libelle" and sub.text:
                labels.append(norm_space(sub.text))
                break
    return labels


def mask_from_labels(labels: list[str], vocab: list[str], alias: dict[str, str] | None = None) -> int:
    index = {label: i for i, label in enumerate(vocab)}
    mask = 0
    for label in labels:
        key = alias.get(label, label) if alias else label
        if key not in index:
            raise ValueError(f"Libellé inconnu pour le masque : {label!r}")
        mask |= 1 << index[key]
    return mask


def niveau_index(label: str) -> int:
    label = norm_space(label)
    if label.upper() == "3E":
        label = "3e"
    if label not in NIVEAUX:
        raise ValueError(f"Niveau d'accès inconnu : {label!r}")
    return NIVEAUX.index(label)


def _to_int(token: str) -> int:
    return int(re.sub(r"[ \u00a0]", "", token))


def _near_month(section: str, end: int) -> bool:
    pre = section[max(0, end - 90) : end].lower()
    post = section[end : end + 40].lower()
    blob = f"{pre} {post}"
    if any(token in blob for token in ("par jour", "par heure", "la journ", "par repr", "par mile")):
        return False
    return ("par mois" in post) or ("par mois" in pre) or ("hebdomadaire" in pre) or ("mensuel" in pre)


def salaire_debutant(vie_professionnelle: str) -> int:
    """Monthly beginner salary in euros, or 0 when the fiche gives no clear figure.

    « Entre A et B » keeps the lower bound (débutant). « De A à B … par mois »
    keeps the amount written just before « euros ». Per-day or indemnity figures
    are ignored. A weekly cinema minimum is kept when that is the only figure,
    matching the October 2026 prototype.
    """
    text = html_to_text(vie_professionnelle)
    match = re.search(r"salaire du d[ée]butant", text, re.I)
    if not match:
        return 0
    rest = text[match.end() :]
    cut = re.search(r"int[ée]grer le march", rest, re.I)
    section = (rest[: cut.start()] if cut else rest[:1200]).strip()
    if not section:
        return 0

    between = re.search(rf"entre\s+{NUM}\s+et\s+{NUM}", section, re.I)
    if between and _near_month(section, between.end()):
        return min(_to_int(between.group(1)), _to_int(between.group(2)))

    start = re.search(rf"(?:à partir de|a partir de|environ|autour de)\s+{NUM}", section, re.I)
    if start and _near_month(section, start.end()):
        return _to_int(start.group(1))

    span = re.search(rf"de\s+{NUM}\s+[àa]\s+{NUM}", section, re.I)
    if span and _near_month(section, span.end()):
        return max(_to_int(span.group(1)), _to_int(span.group(2)))

    plain = re.search(rf"{NUM}\s*euros?\s+brut", section, re.I)
    if plain and _near_month(section, plain.end()):
        prefix = section[max(0, plain.start() - 50) : plain.start()].lower()
        if "exemple" in prefix:
            return 0
        return _to_int(plain.group(1))
    return 0


def clip(text: str, limit: int = 280) -> str:
    text = text.strip()
    if len(text) <= limit:
        return text
    cut = text.rfind(" ", 0, limit)
    if cut < limit * 0.6:
        cut = limit
    return text[:cut].rstrip(" .,;:") + "…"


def pack_crit(record: dict) -> int:
    def code(table: dict[str, int], key: str) -> int:
        value = (record.get(key) or "inconnu").strip().lower()
        if value not in table:
            raise ValueError(f"Valeur enrichie inconnue pour {key} : {value!r} ({record.get('identifiant')})")
        return table[value]

    lieu = code(LIEU_CODE, "lieu")
    tt = code(TT_CODE, "teletravail")
    hor = code(HOR_CODE, "horaires")
    uti = code(UTI_CODE, "utilite")
    sen = code(SEN_CODE, "sensibilite")
    geo = code(GEO_CODE, "contrainte_geo")
    flags = []
    for key, value_code in (
        ("lieu", lieu),
        ("teletravail", tt),
        ("horaires", hor),
        ("utilite", uti),
        ("sensibilite", sen),
        ("contrainte_geo", geo),
    ):
        conf = (record.get(f"{key}_confiance") or "").strip().lower()
        flags.append(value_code != 0 and conf == "haute")
    bits = lieu + tt * 8 + hor * 32 + uti * 128 + sen * 512 + geo * 2048
    conf_bits = 0
    for index, haute in enumerate(flags):
        if haute:
            conf_bits |= 1 << index
    return bits + conf_bits * 8192


def read_xml_bytes(path: Path = SOURCE_ZIP) -> bytes:
    if path.suffix == ".zip":
        with zipfile.ZipFile(path) as archive:
            names = [name for name in archive.namelist() if name.lower().endswith(".xml")]
            if not names:
                raise FileNotFoundError(f"Aucun XML dans {path}")
            return archive.read(names[0])
    return path.read_bytes()


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def parse_metiers(xml_bytes: bytes) -> list[dict]:
    root = ET.fromstring(xml_bytes)
    metiers: list[dict] = []
    seen: set[str] = set()
    for node in root:
        if local(node.tag) != "metier":
            continue
        identifiant = child_text(node, "identifiant").strip()
        match = re.fullmatch(r"MET\.(\d+)", identifiant)
        if not match:
            raise ValueError(f"Identifiant inattendu : {identifiant!r}")
        metier_id = match.group(1)
        if metier_id in seen:
            raise ValueError(f"Doublon {identifiant}")
        seen.add(metier_id)

        nom = norm_space(child_text(node, "nom_metier"))
        if not nom:
            raise ValueError(f"Nom manquant pour {identifiant}")

        niveau_label = ""
        for sub in node:
            if local(sub.tag) == "niveau_acces_min":
                for leaf in sub.iter():
                    if local(leaf.tag) == "libelle" and leaf.text:
                        niveau_label = leaf.text
                        break
        statut_labels = grouped_labels(next((s for s in node if local(s.tag) == "statuts"), None), "statut")
        interet_labels = grouped_labels(
            next((s for s in node if local(s.tag) == "centres_interet"), None),
            "centre_interet",
        )
        secteur_labels = grouped_labels(
            next((s for s in node if local(s.tag) == "secteurs_activite"), None),
            "secteur_activite",
        )
        synonyms: list[str] = []
        for sub in node:
            if local(sub.tag) != "synonymes":
                continue
            for syn in sub:
                if local(syn.tag) != "synonyme":
                    continue
                label = norm_space(child_text(syn, "nom_metier"))
                if label and label.lower() != nom.lower():
                    synonyms.append(label)

        accroche = html_to_text(child_text(node, "accroche_metier"))
        format_court = html_to_text(child_text(node, "format_court"))
        if not accroche:
            accroche = clip(format_court)

        mapped_statuts = [STATUT_ALIAS.get(label, label) for label in statut_labels]
        metiers.append(
            {
                "id": metier_id,
                "identifiant": identifiant,
                "nom": nom,
                "accroche": accroche,
                "niveau": niveau_index(niveau_label),
                "statuts": mask_from_labels(statut_labels, STATUTS, STATUT_ALIAS),
                "salaire": salaire_debutant(child_text(node, "vie_professionnelle")),
                "interets": mask_from_labels(interet_labels, INTERETS),
                "secteurs": mask_from_labels(secteur_labels, SECTEURS),
                "syn": " · ".join(dict.fromkeys(synonyms)),
                "statut_labels": mapped_statuts,
                "secteur_labels": secteur_labels,
                "condition_travail": html_to_text(child_text(node, "condition_travail")),
                "nature_travail": html_to_text(child_text(node, "nature_travail")),
                "vie_professionnelle": html_to_text(child_text(node, "vie_professionnelle")),
                "format_court": format_court,
                "acces_metier": html_to_text(child_text(node, "acces_metier")),
                "accroche_brute": accroche,
            }
        )
    return metiers


def load_domaines(csv_path: Path = SOURCE_CSV) -> dict[str, str]:
    """Map MET id → domaines/sous-domaines from the Onisep CSV (semicolon)."""
    if not csv_path.exists():
        return {}
    import csv

    grouped: dict[str, list[str]] = {}
    with csv_path.open(encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle, delimiter=";")
        for row in reader:
            link = row.get("lien site onisep.fr") or ""
            match = re.search(r"MET\.(\d+)", link)
            if not match:
                continue
            domaine = norm_space(row.get("domaine/sous-domaine") or "")
            if not domaine:
                continue
            bucket = grouped.setdefault(match.group(1), [])
            for piece in domaine.split("|"):
                piece = piece.strip(" |")
                if piece and piece not in bucket:
                    bucket.append(piece)
    return {key: " · ".join(values) for key, values in grouped.items()}
