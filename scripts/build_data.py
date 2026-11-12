#!/usr/bin/env python3
"""Build the static catalogue consumed by the site.

Reads the Onisep XML (zip), the idéo CSV and enrichi.json, then writes:

- public/data/catalog.json
- src/generated/dataset.ts

Pass --export-textes to also write data/work/fiches-textes.json for scripts/enrich.py.
Pass --no-fixture-check to skip the October 2026 prototype parity check
(needed when you import a newer Onisep extract).
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from onisep_parse import (  # noqa: E402
    SNAPSHOT_ZIP_SHA256,
    SOURCE_ENRICHI,
    SOURCE_ZIP,
    load_domaines,
    pack_crit,
    parse_metiers,
    read_xml_bytes,
    sha256_file,
)

PUBLIC_CATALOG = ROOT / "public" / "data" / "catalog.json"
DATASET_TS = ROOT / "src" / "generated" / "dataset.ts"
FIXTURE_ROWS = ROOT / "data" / "fixtures" / "compact-metiers.json"
FIXTURE_CRIT = ROOT / "data" / "fixtures" / "crit-array.js"
TEXTES = ROOT / "data" / "work" / "fiches-textes.json"
GRILLE = ROOT / "data" / "source" / "grille.json"


def load_crit_fixture(path: Path) -> list[int]:
    text = path.read_text(encoding="utf-8")
    return [int(token) for token in __import__("re").findall(r"\d+", text)]


def fold_name(value: str) -> str:
    value = value.replace("’", "'").replace("\xa0", " ").replace("\u202f", " ")
    return re.sub(r"\s+", " ", value).strip()


def check_fixtures(rows: list[dict], digest: str) -> None:
    if digest != SNAPSHOT_ZIP_SHA256:
        print("Extract différent du snapshot d'octobre 2026 : contrôle de parité ignoré.")
        return
    if not FIXTURE_ROWS.exists() or not FIXTURE_CRIT.exists():
        raise SystemExit("Fixtures de parité manquantes dans data/fixtures/")
    compact = json.loads(FIXTURE_ROWS.read_text(encoding="utf-8"))["rows_d150"]
    crits = load_crit_fixture(FIXTURE_CRIT)
    if len(compact) != len(rows) or len(crits) != len(rows):
        raise SystemExit(f"Taille inattendue compact={len(compact)} crit={len(crits)} rows={len(rows)}")
    mismatches = 0
    for index, (row, expected, crit) in enumerate(zip(rows, compact, crits)):
        actual = [row["id"], row["niveau"], row["statuts"], row["salaire"], row["interets"], row["secteurs"], row["crit"]]
        wanted = [expected[0], expected[3], expected[4], expected[5], expected[6], expected[7], crit]
        if actual != wanted or fold_name(row["nom"]) != fold_name(expected[1]):
            mismatches += 1
            if mismatches <= 8:
                print("Écart", index, row["id"], "nom", row["nom"], "vs", expected[1])
                print("  obtenu", actual)
                print("  attendu", wanted)
    if mismatches:
        raise SystemExit(f"{mismatches} métiers ne correspondent pas au prototype d'octobre 2026.")
    print(f"Parité prototype OK ({len(rows)} métiers, critères enrichis inclus).")


def export_textes(rows: list[dict], path: Path) -> None:
    payload = []
    for row in rows:
        payload.append(
            {
                "identifiant": row["identifiant"],
                "nom": row["nom"],
                "secteurs": row["secteur_labels"],
                "statuts": row["statut_labels"],
                "condition_travail": row["condition_travail"],
                "nature_travail": row["nature_travail"],
                "vie_professionnelle": row["vie_professionnelle"],
                "accroche": row["accroche_brute"],
                "format_court": row["format_court"],
                "acces_metier": row["acces_metier"],
            }
        )
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
    print("Textes exportés :", path)


def build(check: bool, export: bool) -> None:
    digest = sha256_file(SOURCE_ZIP)
    xml_bytes = read_xml_bytes(SOURCE_ZIP)
    parsed = parse_metiers(xml_bytes)
    enrichi = json.loads(SOURCE_ENRICHI.read_text(encoding="utf-8"))
    by_id = {}
    for record in enrichi:
        identifiant = record.get("identifiant") or ""
        metier_id = identifiant.split(".")[-1]
        by_id[metier_id] = record
    missing = [row["id"] for row in parsed if row["id"] not in by_id]
    if missing:
        sample = ", ".join(missing[:8])
        raise SystemExit(
            f"{len(missing)} métiers sans enrichissement ({sample}). "
            "Lance scripts/build_data.py --export-textes puis scripts/enrich.py."
        )

    domaines = load_domaines()
    covered = sum(1 for row in parsed if row["id"] in domaines)
    print(f"CSV idéo : {covered}/{len(parsed)} métiers ont un domaine.")

    grille = json.loads(GRILLE.read_text(encoding="utf-8")) if GRILLE.exists() else None
    if grille is None:
        print("data/source/grille.json absent : lance scripts/france_travail.py pour la phase 2.")

    catalog_rows = []
    for row in parsed:
        record = by_id[row["id"]]
        row["crit"] = pack_crit(record)
        mots = " · ".join(part for part in (row["syn"], domaines.get(row["id"], "")) if part)
        catalog_rows.append(
            {
                "id": row["id"],
                "nom": row["nom"],
                "accroche": row["accroche"],
                "niveau": row["niveau"],
                "statuts": row["statuts"],
                "salaire": row["salaire"],
                "interets": row["interets"],
                "secteurs": row["secteurs"],
                "crit": row["crit"],
                "mots": mots,
            }
        )
        if grille is not None:
            entry = grille["metiers"].get(row["id"])
            if entry is None:
                raise SystemExit(f"Métier {row['id']} absent de grille.json : relance scripts/france_travail.py")
            entry = dict(entry)
            if "b" in entry:
                entry["b"] = dict(entry["b"], n=[grille["fap"].get(code, code) for code in entry["b"]["f"]])
            catalog_rows[-1]["g"] = entry

    if check:
        check_fixtures(catalog_rows, digest)

    if export:
        export_textes(parsed, TEXTES)

    salaries = sum(1 for row in catalog_rows if row["salaire"])
    catalog = {
        "license": "ODbL-1.0",
        "attribution": "Données Onisep (Idéo-Fiches métiers) – licence ODbL",
        "source": "https://www.data.gouv.fr/datasets/ideo-fiches-metiers",
        "sourceDate": "2026-10-21",
        "sourceLabel": "octobre 2026",
        "count": len(catalog_rows),
        "note": "Les critères lieu, télétravail, horaires, utilité, résistance aux crises et contrainte géographique sont des estimations déduites des textes Onisep lorsque la fiche ne les écrit pas noir sur blanc.",
        "metiers": catalog_rows,
    }
    if grille is not None:
        catalog["ft"] = {"sources": grille["sources"], "fap": grille["fap"], "bmoNational": grille["bmo_national"]}
    PUBLIC_CATALOG.parent.mkdir(parents=True, exist_ok=True)
    PUBLIC_CATALOG.write_text(json.dumps(catalog, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    DATASET_TS.parent.mkdir(parents=True, exist_ok=True)
    DATASET_TS.write_text(
        "\n".join(
            [
                "// Généré par scripts/build_data.py — ne pas éditer à la main.",
                "export const DATASET = {",
                f"  count: {len(catalog_rows)},",
                '  sourceDate: "2026-10-21",',
                '  sourceLabel: "octobre 2026",',
                '  attribution: "Données Onisep (Idéo-Fiches métiers) – licence ODbL",',
                '  sourceUrl: "https://www.data.gouv.fr/datasets/ideo-fiches-metiers",',
                "} as const",
                "",
                "/** Phase 2 : sources France Travail / Dares (open data). */",
                f"export const FT_SOURCES = {json.dumps(grille['sources'] if grille else {}, ensure_ascii=False, indent=2)} as const",
                "",
                f"export const BMO_NATIONAL = {json.dumps(grille['bmo_national'] if grille else {}, ensure_ascii=False)} as const",
                "",
            ]
        ),
        encoding="utf-8",
    )
    size = PUBLIC_CATALOG.stat().st_size
    print(f"{len(catalog_rows)} métiers, {salaries} salaires parsés, catalogue {size / 1024:.0f} Ko → {PUBLIC_CATALOG}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Construit le JSON statique du site.")
    parser.add_argument("--no-fixture-check", action="store_true")
    parser.add_argument("--export-textes", action="store_true")
    args = parser.parse_args()
    build(check=not args.no_fixture_check, export=args.export_textes)


if __name__ == "__main__":
    main()
