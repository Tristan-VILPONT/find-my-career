import type { Answers, CritDecoded, Metier, QuestionId, RankedMetier, ScoreDetail } from "./types.ts"
import {
  ANNEE,
  GEO_LIB,
  HOR_LIB,
  LIEU_LIB,
  SEN_LIB,
  TT_LIB,
  UTI_LIB,
} from "./vocab.ts"
import { parcoursHaute, scoreInvest, scoreParcours, scoreSante, scoreTempsLibre } from "./grille.ts"

const IDX_ARTISAN = 1
const IDX_INDEP = 4
const IDX_LIBERAL = 7
const IDX_FONCT = 0
const IDX_MILIT = 2
const IDX_SALARIE = 8

export function hasBit(mask: number, index: number): boolean {
  return Math.floor(mask / 2 ** index) % 2 === 1
}

export function labelsFromMask(mask: number, labels: string[]): string[] {
  const out: string[] = []
  for (let index = 0; index < labels.length; index += 1) {
    if (hasBit(mask, index)) out.push(labels[index])
  }
  return out
}

export function indicesFromMask(mask: number, length: number): number[] {
  const out: number[] = []
  for (let index = 0; index < length; index += 1) {
    if (hasBit(mask, index)) out.push(index)
  }
  return out
}

export function norm(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

export function scoreEtudes(niveauIdx: number, choix: string): number | null {
  if (choix === "egal") return null
  const years = ANNEE[niveauIdx] ?? -1
  if (years < 0) return 0.6
  if (choix === "court") {
    if (years <= 5) return 1
    if (years <= 7) return 0.45
    return 0.1
  }
  if (choix === "moyen") {
    if (years === 6 || years === 7) return 1
    if (years === 5 || years === 8) return 0.55
    return 0.2
  }
  if (years >= 8) return 1
  if (years >= 6) return 0.4
  return 0.1
}

export function estIndependant(statuts: number): boolean {
  return hasBit(statuts, IDX_INDEP) || hasBit(statuts, IDX_ARTISAN) || hasBit(statuts, IDX_LIBERAL)
}

export function estSalarie(statuts: number): boolean {
  return hasBit(statuts, IDX_SALARIE) || hasBit(statuts, IDX_FONCT) || hasBit(statuts, IDX_MILIT)
}

export function scorePatron(statuts: number, choix: string): number | null {
  if (choix === "egal") return null
  const indep = estIndependant(statuts)
  if (choix === "oui") return indep ? 1 : 0.15
  if (choix === "pourquoi") return indep ? 0.8 : 0.5
  if (indep && estSalarie(statuts)) return 0.55
  if (indep) return 0.2
  if (estSalarie(statuts)) return 1
  return 0.5
}

export function scoreSalaire(pay: number, choix: string): number | null {
  if (choix === "egal") return null
  if (!pay) return null
  const t = Math.max(0, Math.min(1, (pay - 1479) / (5827 - 1479)))
  if (choix === "important") return 0.15 + 0.85 * t
  return 0.7 + 0.3 * t
}

export function unpackCrit(packed: number): CritDecoded {
  const bits = packed % 8192
  const conf = Math.floor(packed / 8192)
  return {
    lieu: bits % 8,
    tt: Math.floor(bits / 8) % 4,
    hor: Math.floor(bits / 32) % 4,
    uti: Math.floor(bits / 128) % 4,
    sen: Math.floor(bits / 512) % 4,
    geo: Math.floor(bits / 2048) % 4,
    lieuH: conf % 2 === 1,
    ttH: Math.floor(conf / 2) % 2 === 1,
    horH: Math.floor(conf / 4) % 2 === 1,
    utiH: Math.floor(conf / 8) % 2 === 1,
    senH: Math.floor(conf / 16) % 2 === 1,
    geoH: Math.floor(conf / 32) % 2 === 1,
  }
}

export function avecEstimation(libelle: string, haute: boolean): string {
  return haute ? libelle : `${libelle} (estimation)`
}

export function ficheCrit(crit: CritDecoded): { label: string; value: string }[] {
  const out: { label: string; value: string }[] = []
  if (crit.lieu) out.push({ label: "Lieu de travail", value: avecEstimation(LIEU_LIB[crit.lieu], crit.lieuH) })
  if (crit.tt) out.push({ label: "Télétravail", value: avecEstimation(TT_LIB[crit.tt], crit.ttH) })
  if (crit.hor) out.push({ label: "Horaires", value: avecEstimation(HOR_LIB[crit.hor], crit.horH) })
  if (crit.uti) out.push({ label: "Utile aux autres", value: avecEstimation(UTI_LIB[crit.uti], crit.utiH) })
  if (crit.sen) {
    out.push({
      label: "Résistance aux crises et à l'automatisation",
      value: avecEstimation(SEN_LIB[crit.sen], crit.senH),
    })
  }
  if (crit.geo) out.push({ label: "Contrainte géographique", value: avecEstimation(GEO_LIB[crit.geo], crit.geoH) })
  return out
}

export function poidsConf(haute: boolean): number {
  return haute ? 1 : 0.5
}

function pick(table: number[], code: number): number | null {
  if (!code) return null
  return table[code] ?? 0.4
}

export function scoreLieu(code: number, choix: string): number | null {
  if (choix === "egal") return null
  if (choix === "dehors") return pick([0, 1, 0.1, 0.55, 0.25], code)
  if (choix === "bureau") return pick([0, 0.1, 1, 0.55, 0.3], code)
  if (choix === "mixte") return pick([0, 0.5, 0.5, 1, 0.5], code)
  if (choix === "atelier") return pick([0, 0.25, 0.15, 0.55, 1], code)
  return null
}

export function scoreTeletravail(code: number, choix: string): number | null {
  if (choix === "egal") return null
  if (choix === "oui") return pick([0, 1, 0.75, 0.1], code)
  if (choix === "mix") return pick([0, 0.75, 1, 0.35], code)
  if (choix === "non") return pick([0, 0.2, 0.45, 1], code)
  return null
}

export function scoreHoraires(code: number, choix: string): number | null {
  if (choix === "egal") return null
  if (choix === "reguliers") return pick([0, 1, 0.15, 0.45], code)
  if (choix === "okdecale") return pick([0, 0.75, 1, 0.85], code)
  return null
}

export function scoreUtilite(code: number, choix: string): number | null {
  if (choix === "egal") return null
  if (choix === "oui") return pick([0, 1, 0.5, 0.1], code)
  if (choix === "unpeu") return pick([0, 0.75, 1, 0.45], code)
  return null
}

export function scoreSensibilite(code: number, choix: string): number | null {
  if (choix === "egal") return null
  if (choix === "solide") return pick([0, 1, 0.5, 0.1], code)
  if (choix === "plus") return pick([0, 0.8, 0.85, 0.45], code)
  return null
}

export function scoreGeo(code: number, choix: string): number | null {
  if (choix === "egal") return null
  if (choix === "rester") return pick([0, 1, 0.15], code)
  if (choix === "bouger") return pick([0, 0.85, 1], code)
  return null
}

export function scoreInterets(mask: number, selected: number[]): number | null {
  if (selected.length === 0) return null
  let metierCount = 0
  for (let index = 0; index < 30; index += 1) {
    if (hasBit(mask, index)) metierCount += 1
  }
  const matches = selected.filter((index) => hasBit(mask, index)).length
  if (metierCount === 0) return matches > 0 ? 0.5 : 0
  const precision = matches / selected.length
  const recall = matches / metierCount
  const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0
  const bonus = Math.min(0.12, Math.max(0, matches - 1) * 0.04)
  return Math.min(1, f1 + bonus)
}

export function scorer(metier: Metier, answers: Answers, interets: number[]): ScoreDetail {
  const parts: { label: string; value: number; poids: number }[] = []
  const push = (id: QuestionId | "interets", label: string, value: number | null, poids = 1) => {
    if (id !== "interets" && !answers[id]) return
    if (value !== null) parts.push({ label, value, poids })
  }
  if (answers.etudes) push("etudes", "Durée des études", scoreEtudes(metier.niveau, answers.etudes))
  if (answers.patron) {
    if (metier.g) {
      const value = scoreParcours(metier.g, answers.patron)
      if (value !== null) parts.push({ label: "Ton parcours (salarié, indépendant, entreprise)", value, poids: poidsConf(parcoursHaute(metier.g, answers.patron)) })
    } else {
      push("patron", "Être son propre patron", scorePatron(metier.statuts, answers.patron === "proprio" || answers.patron === "etp" ? "oui" : answers.patron))
    }
  }
  if (answers.salaire) push("salaire", "Salaire", scoreSalaire(metier.salaire, answers.salaire))
  const interetValue = scoreInterets(metier.interets, interets)
  if (interetValue !== null) parts.push({ label: "Ce qui te ressemble", value: interetValue, poids: 1 })

  const crit = unpackCrit(metier.crit)
  if (answers.lieu) {
    const value = scoreLieu(crit.lieu, answers.lieu)
    if (value !== null) parts.push({ label: "Lieu de travail", value, poids: poidsConf(crit.lieuH) })
  }
  if (answers.teletravail) {
    const value = scoreTeletravail(crit.tt, answers.teletravail)
    if (value !== null) parts.push({ label: "Télétravail", value, poids: poidsConf(crit.ttH) })
  }
  if (answers.horaires) {
    const value = scoreHoraires(crit.hor, answers.horaires)
    if (value !== null) parts.push({ label: "Horaires", value, poids: poidsConf(crit.horH) })
  }
  if (answers.utilite) {
    const value = scoreUtilite(crit.uti, answers.utilite)
    if (value !== null) parts.push({ label: "Utile aux autres", value, poids: poidsConf(crit.utiH) })
  }
  if (answers.sensibilite) {
    const value = scoreSensibilite(crit.sen, answers.sensibilite)
    if (value !== null) parts.push({ label: "Résistance aux crises", value, poids: poidsConf(crit.senH) })
  }
  if (answers.geo) {
    const value = scoreGeo(crit.geo, answers.geo)
    if (value !== null) parts.push({ label: "Lieu de vie", value, poids: poidsConf(crit.geoH) })
  }

  if (answers.invest) {
    const value = scoreInvest(metier.g?.i, answers.invest)
    if (value !== null) parts.push({ label: "Utile pour investir", value, poids: 0.5 })
  }
  if (answers.tempslibre) {
    const value = scoreTempsLibre(metier.g?.t, answers.tempslibre)
    if (value !== null) parts.push({ label: "Temps libre", value, poids: poidsConf(metier.g?.th === 1) })
  }
  if (answers.sante) {
    const value = scoreSante(metier.g, answers.sante)
    if (value !== null) parts.push({ label: "Santé", value, poids: poidsConf(metier.g?.sh === 1) })
  }

  const communs = interets.filter((index) => hasBit(metier.interets, index))
  const raisons = parts.filter((part) => part.value >= 0.8).map((part) => part.label)
  if (communs.length > 0 && !raisons.includes("Ce qui te ressemble")) raisons.push("Ce qui te ressemble")
  if (parts.length === 0) return { pct: 0, raisons, communs }
  const totalPoids = parts.reduce((sum, part) => sum + part.poids, 0)
  const avg = parts.reduce((sum, part) => sum + part.value * part.poids, 0) / totalPoids
  return { pct: Math.round(avg * 100), raisons, communs }
}

export function rankMetiers(metiers: Metier[], answers: Answers, interets: number[]): RankedMetier[] {
  return metiers
    .map((metier) => ({ ...metier, ...scorer(metier, answers, interets) }))
    .sort((a, b) => b.pct - a.pct || a.nom.localeCompare(b.nom, "fr"))
}

export function hasProfile(answers: Answers, interets: number[]): boolean {
  return interets.length > 0 || Object.values(answers).some((value) => Boolean(value))
}
