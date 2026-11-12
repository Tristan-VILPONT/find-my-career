export type QuestionId =
  | "etudes"
  | "patron"
  | "salaire"
  | "lieu"
  | "teletravail"
  | "horaires"
  | "utilite"
  | "sensibilite"
  | "geo"
  | "invest"
  | "tempslibre"
  | "sante"

export type Answers = Partial<Record<QuestionId, string>>

export type Metier = {
  id: string
  nom: string
  accroche: string
  niveau: number
  statuts: number
  salaire: number
  interets: number
  secteurs: number
  crit: number
  mots: string
  /** Phase 2 : France Travail (ROME, BMO) et critères de la grille de Tristan. */
  g?: Grille
}

/** Niveaux : 0 inconnu, 1 oui / favorable, 2 possible / intermédiaire, 3 non / défavorable. */
export type Grille = {
  /** Codes ROME 4.0 reliés à la fiche Onisep. */
  r?: string[]
  /** Intitulés des fiches ROME. */
  rl?: string[]
  /** Parcours [Employé, Travailleur indépendant, Propriétaire]. */
  e: [number, number, number]
  /** Confiance haute : bit 1 = E, 2 = T, 4 = P. */
  eh: number
  /** Phrase de la fiche Onisep qui appuie T ou P. */
  ep?: string
  /** Investisseur : 1 oui, 2 petit avantage, 3 pas particulièrement (toujours une estimation). */
  i: number
  ir?: string
  /** Temps libre : 1 plutôt préservé, 2 quelques contraintes, 3 contraint. */
  t?: number
  th?: number
  tx?: string[]
  /** Santé : global, physique, risques, stress (1 faible … 3 fort, global 1 = préservée). */
  s?: number
  sp?: number
  sr?: number
  ss?: number
  sh?: number
  sx?: string[]
  sxs?: string[]
  /** BMO 2026 : projets de recrutement, % difficiles, % saisonniers, familles FAP. */
  b?: { p: number; d: number | null; s: number | null; f: string[]; n?: string[] }
}

export type SourceRef = { label: string; annee: string; url: string; licence: string }

export type FranceTravailMeta = {
  sources: { rome: SourceRef; bmo: SourceRef; fap: SourceRef }
  fap: Record<string, string>
  bmoNational: { projets: number; difficiles_pct: number | null }
}

export type CatalogFile = {
  license: string
  attribution: string
  source: string
  sourceDate: string
  sourceLabel: string
  count: number
  note: string
  metiers: Metier[]
  ft?: FranceTravailMeta
}

export type CritDecoded = {
  lieu: number
  tt: number
  hor: number
  uti: number
  sen: number
  geo: number
  lieuH: boolean
  ttH: boolean
  horH: boolean
  utiH: boolean
  senH: boolean
  geoH: boolean
}

export type ScoreDetail = {
  pct: number
  raisons: string[]
  communs: number[]
}

export type RankedMetier = Metier & ScoreDetail
