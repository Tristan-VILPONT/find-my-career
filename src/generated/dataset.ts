// Généré par scripts/build_data.py — ne pas éditer à la main.
export const DATASET = {
  count: 1138,
  sourceDate: "2026-10-21",
  sourceLabel: "octobre 2026",
  attribution: "Données Onisep (Idéo-Fiches métiers) – licence ODbL",
  sourceUrl: "https://www.data.gouv.fr/datasets/ideo-fiches-metiers",
} as const

/** Phase 2 : sources France Travail / Dares (open data). */
export const FT_SOURCES = {
  "rome": {
    "label": "ROME 4.0 (version 62, octobre 2026) – France Travail",
    "annee": "2026",
    "url": "https://www.data.gouv.fr/datasets/repertoire-operationnel-des-metiers-et-des-emplois-rome",
    "licence": "Licence Ouverte"
  },
  "bmo": {
    "label": "Enquête Besoins en Main-d'Œuvre (BMO) 2026 – France Travail",
    "annee": "2026",
    "url": "https://www.data.gouv.fr/datasets/enquete-besoins-en-main-doeuvre-bmo",
    "licence": "Licence Ouverte"
  },
  "fap": {
    "label": "Table de passage FAP-2021 / ROME – Dares",
    "annee": "2023",
    "url": "https://www.data.gouv.fr/datasets/la-nomenclature-des-familles-professionnelles-2021",
    "licence": "Dares"
  }
} as const

export const BMO_NATIONAL = {"projets": 2237486, "difficiles_pct": 50} as const
