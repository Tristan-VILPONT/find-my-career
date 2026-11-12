import { BMO_NATIONAL, FT_SOURCES } from "../generated/dataset.ts"
import { formatNombre } from "./format.ts"
import type { Grille, Metier } from "./types.ts"

/** Phase 2 : critères de la grille (E/T/P, investisseur, temps libre, santé) et données France Travail. */

export const SEUIL_RECRUTE = 10000
export const SEUIL_DIFFICILE = 60

export const E_LIB = ["", "oui", "possible, moins courant", "rare"]
export const T_LIB = ["", "oui", "possible", "rare ou impossible"]
export const P_LIB = ["", "oui", "possible", "peu probable"]
export const INV_LIB = ["", "Oui", "Un petit avantage", "Pas particulièrement"]
export const TL_LIB = ["", "Plutôt préservé", "Quelques contraintes", "Contraint"]
export const SANTE_LIB = ["", "Plutôt préservée", "À surveiller", "Exigeante"]
export const NIV_LIB = ["", "faible", "moyen", "fort"]
export const RISQUE_LIB = ["", "faibles", "présents", "élevés"]

export function metierscope(code: string): string {
  return `https://candidat.francetravail.fr/metierscope/fiche-metier/${code}`
}

function est(value: string, haute: boolean): string {
  return haute ? value : `${value} (estimation)`
}

export function parcoursComplet(g?: Grille): boolean {
  return Boolean(g && g.e[0] === 1 && g.e[1] === 1 && (g.e[2] === 1 || g.e[2] === 2))
}

export function recruteBeaucoup(g?: Grille): boolean {
  return Boolean(g?.b && g.b.p >= SEUIL_RECRUTE)
}

export function recrutementDifficile(g?: Grille): boolean {
  return Boolean(g?.b && g.b.d !== null && g.b.d >= SEUIL_DIFFICILE)
}

export type Row = { label: string; value: string }

export function grilleRows(metier: Metier): Row[] {
  const g = metier.g
  if (!g) return []
  const rows: Row[] = []
  const [e, t, p] = g.e
  const parts = [
    `Salarié : ${est(E_LIB[e], (g.eh & 1) === 1)}`,
    `À ton compte : ${est(T_LIB[t], (g.eh & 2) === 2)}`,
    `Ta propre entreprise : ${est(P_LIB[p], (g.eh & 4) === 4)}`,
  ]
  const suite = parcoursComplet(g) ? " Les trois étapes sont possibles." : ""
  const preuve = g.ep ? ` (${g.ep.charAt(0).toUpperCase()}${g.ep.slice(1)}.)` : ""
  rows.push({ label: "Parcours Employé → Indépendant → Propriétaire", value: `${parts.join(" · ")}.${suite}${preuve}` })
  if (g.i) {
    const raison = g.ir ? ` : ${g.ir}` : ""
    rows.push({ label: "Utile pour investir ou se construire un patrimoine", value: est(`${INV_LIB[g.i]}${raison}`, false) })
  }
  if (g.t) {
    const details = g.tx && g.tx.length > 0 ? ` : ${g.tx.join(", ")}` : ""
    rows.push({ label: "Temps libre (horaires, astreintes, week-ends)", value: est(`${TL_LIB[g.t]}${details}`, g.th === 1) })
  }
  if (g.s) {
    const base = `${SANTE_LIB[g.s]}. Effort physique : ${NIV_LIB[g.sp ?? 0]}, risques : ${RISQUE_LIB[g.sr ?? 0]}`
    const details = g.sx && g.sx.length > 0 ? ` Points d'attention : ${g.sx.join(", ")}.` : ""
    const stress = ` Stress : ${NIV_LIB[g.ss ?? 0] || "non renseigné"} (estimation).`
    rows.push({ label: "Santé (effort physique, risques, stress)", value: `${g.sh === 1 ? `${base}.` : `${base} (estimation).`}${details}${stress}` })
  }
  return rows
}

export function marcheRows(metier: Metier): Row[] {
  const g = metier.g
  if (!g) return []
  const rows: Row[] = []
  if (g.b) {
    const familles = (g.b.n ?? g.b.f).map((nom) => `« ${nom} »`).join(", ")
    const tags = [recruteBeaucoup(g) ? "recrute beaucoup" : "", recrutementDifficile(g) ? "difficultés de recrutement" : ""].filter(Boolean)
    const tag = tags.length > 0 ? ` En bref : ${tags.join(", ")}.` : ""
    rows.push({
      label: `Recrutements prévus en ${FT_SOURCES.bmo.annee} (France entière)`,
      value: `${formatNombre(g.b.p)} projets de recrutement pour la famille de métiers ${familles}.${tag}`,
    })
    if (g.b.d !== null) {
      const moyenne = BMO_NATIONAL.difficiles_pct
      rows.push({
        label: "Difficultés de recrutement",
        value: `${g.b.d} % des projets sont jugés difficiles par les employeurs (moyenne tous métiers : ${moyenne} %).`,
      })
    }
  }
  if (g.r && g.r.length > 0) {
    rows.push({
      label: "Fiche ROME (France Travail)",
      value: g.r.map((code, index) => `${code} – ${g.rl?.[index] ?? ""}`.trim()).join(" · "),
    })
  }
  return rows
}

export function sourcesPhrase(metier: Metier): string {
  const g = metier.g
  if (!g) return ""
  const parts: string[] = []
  if (g.b) {
    parts.push(
      `Recrutements : ${FT_SOURCES.bmo.label}, chiffres de la famille professionnelle (FAP-2021) reliée par la table de passage de la Dares, pas du métier exact. Les cases masquées pour secret statistique ne sont pas comptées.`,
    )
  }
  if (g.r && g.r.length > 0) {
    parts.push(`Conditions de travail : ${FT_SOURCES.rome.label}, d'après la fiche ROME reliée par l'Onisep.`)
  }
  parts.push("Critères de la grille : déduits des statuts et textes Onisep et des contextes de travail du ROME. « (estimation) » veut dire que ce n'est pas écrit noir sur blanc.")
  return parts.join(" ")
}

// ------------------------------------------------------------------ score

function pick(table: number[], code: number | undefined): number | null {
  if (!code) return null
  return table[code] ?? null
}

export function scoreInvest(code: number | undefined, choix: string): number | null {
  if (choix === "egal") return null
  if (choix === "oui") return pick([0, 1, 0.55, 0.15], code)
  if (choix === "plus") return pick([0, 1, 0.8, 0.5], code)
  return null
}

export function scoreTempsLibre(code: number | undefined, choix: string): number | null {
  if (choix === "egal") return null
  if (choix === "oui") return pick([0, 1, 0.5, 0.1], code)
  if (choix === "unpeu") return pick([0, 1, 0.85, 0.4], code)
  return null
}

export function scoreSante(g: Grille | undefined, choix: string): number | null {
  if (choix === "egal" || !g?.s) return null
  if (choix === "oui") return pick([0, 1, 0.5, 0.1], g.s)
  if (choix === "risques") return pick([0, 1, 0.6, 0.15], g.sr)
  return null
}

const VAL = [0.5, 1, 0.6, 0.15]

/** Question « patron » enrichie avec le parcours E/T/P. */
export function scoreParcours(g: Grille, choix: string): number | null {
  if (choix === "egal") return null
  const [e, t, p] = g.e.map((level) => VAL[level] ?? 0.5)
  if (choix === "salarie") return e
  if (choix === "oui") return t
  if (choix === "proprio") return p
  if (choix === "etp") return Math.round(((e + t + p) / 3) * 100) / 100
  if (choix === "pourquoi") return 0.5 + 0.5 * t
  return null
}

export function parcoursHaute(g: Grille, choix: string): boolean {
  if (choix === "salarie") return (g.eh & 1) === 1
  if (choix === "oui" || choix === "pourquoi") return (g.eh & 2) === 2
  if (choix === "proprio") return (g.eh & 4) === 4
  return g.eh === 7
}

export const FILTRES_GRILLE: { value: string; label: string; test: (g?: Grille) => boolean }[] = [
  { value: "etp", label: "Parcours salarié → indépendant → propriétaire possible", test: parcoursComplet },
  { value: "compte", label: "Peut s'exercer à son compte", test: (g) => g?.e[1] === 1 },
  { value: "invest", label: "Utile pour investir (estimation)", test: (g) => g?.i === 1 || g?.i === 2 },
  { value: "tempslibre", label: "Temps libre plutôt préservé", test: (g) => g?.t === 1 },
  { value: "sante", label: "Santé plutôt préservée", test: (g) => g?.s === 1 },
  { value: "recrute", label: "Recrute beaucoup (BMO 2026)", test: recruteBeaucoup },
  { value: "difficile", label: "Les employeurs ont du mal à recruter (BMO 2026)", test: recrutementDifficile },
]
