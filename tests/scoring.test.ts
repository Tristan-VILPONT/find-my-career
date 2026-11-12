import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { DATASET } from "../src/generated/dataset.ts"
import { bannerCorrespondance } from "../src/lib/format.ts"
import {
  ficheCrit,
  hasBit,
  rankMetiers,
  scoreEtudes,
  scoreInterets,
  scorePatron,
  scoreSalaire,
  scorer,
  unpackCrit,
} from "../src/lib/scoring.ts"
import type { CatalogFile, Metier } from "../src/lib/types.ts"

const catalog = JSON.parse(readFileSync("public/data/catalog.json", "utf8")) as CatalogFile

function metier(partial: Partial<Metier> = {}): Metier {
  return {
    id: "x",
    nom: "Test",
    accroche: "",
    niveau: 4,
    statuts: 1 << 8,
    salaire: 0,
    interets: 1,
    secteurs: 0,
    crit: 1,
    mots: "",
    ...partial,
  }
}

describe("scoring", () => {
  it("traite les valeurs inconnues comme neutres", () => {
    expect(scoreEtudes(4, "egal")).toBeNull()
    expect(scoreSalaire(0, "important")).toBeNull()
    expect(scoreSalaire(1479, "egal")).toBeNull()
    expect(scoreInterets(1, [])).toBeNull()
    expect(scorer(metier({ crit: 0 }), {}, []).pct).toBe(0)
  })

  it("note les études comme le prototype", () => {
    expect(scoreEtudes(4, "court")).toBe(1)
    expect(scoreEtudes(10, "moyen")).toBe(1)
    expect(scoreEtudes(3, "long")).toBe(1)
    expect(scoreEtudes(3, "court")).toBe(0.1)
    expect(scoreEtudes(8, "court")).toBe(0.6)
  })

  it("rapproche le statut indépendant du fait d'être son propre patron", () => {
    expect(scorePatron(1 << 4, "oui")).toBe(1)
    expect(scorePatron(1 << 8, "oui")).toBe(0.15)
    expect(scorePatron(1 << 8, "salarie")).toBe(1)
    expect(scorePatron((1 << 4) | (1 << 8), "salarie")).toBe(0.55)
    expect(scorePatron(1 << 4, "pourquoi")).toBe(0.8)
    expect(scorePatron(0, "egal")).toBeNull()
  })

  it("échelonne le salaire sans pénaliser un montant absent", () => {
    expect(scoreSalaire(1479, "important")).toBeCloseTo(0.15)
    expect(scoreSalaire(5827, "important")).toBeCloseTo(1)
    expect(scoreSalaire(1479, "correct")).toBeCloseTo(0.7)
  })

  it("mélange rappel, précision et un bonus plafonné", () => {
    expect(scoreInterets(1, [0])).toBe(1)
    expect(scoreInterets(1, [0, 1])).toBeCloseTo(2 / 3)
    expect(scoreInterets(0, [0])).toBe(0)
    expect(scoreInterets(15, [0, 1, 2, 3])).toBe(1)
    const plusieurs = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    expect(scoreInterets(31, plusieurs)).toBeCloseTo(2 / 3 + 0.12)
  })

  it("donne un poids 0,5 aux critères qui ne sont pas de confiance haute", () => {
    const detail = scorer(metier({ niveau: 4, crit: 1 }), { etudes: "court", lieu: "bureau" }, [])
    expect(detail.pct).toBe(70)
    const haute = 1 + 1 * 8192
    expect(scorer(metier({ crit: haute }), { etudes: "court", lieu: "dehors" }, []).pct).toBe(100)
  })

  it("décode le critère du gardien de police municipale", () => {
    const crit = unpackCrit(43739)
    expect(crit).toMatchObject({
      lieu: 3,
      tt: 3,
      hor: 2,
      uti: 1,
      sen: 1,
      geo: 1,
      lieuH: true,
      ttH: false,
      horH: true,
    })
    const lines = ficheCrit(crit)
    expect(lines.find((line) => line.label === "Lieu de travail")?.value).toBe("Mixte")
    expect(lines.find((line) => line.label === "Télétravail")?.value).toContain("(estimation)")
  })

  it("lit les masques au-delà de 32 bits", () => {
    expect(hasBit(2 ** 47, 47)).toBe(true)
    expect(hasBit(2 ** 47, 46)).toBe(false)
  })
})

describe("catalogue", () => {
  it("contient les 1138 métiers du snapshot d'octobre 2026", () => {
    expect(DATASET.count).toBe(1138)
    expect(catalog.count).toBe(1138)
    expect(catalog.metiers).toHaveLength(1138)
    expect(new Set(catalog.metiers.map((item) => item.id)).size).toBe(1138)
    expect(catalog.metiers.filter((item) => item.salaire > 0)).toHaveLength(793)
    const gardien = catalog.metiers.find((item) => item.id === "579")
    expect(gardien?.nom).toContain("gardien")
    expect(gardien?.salaire).toBe(1868)
    expect(gardien?.crit).toBe(43739)
    const illustrateur = catalog.metiers.find((item) => item.id === "780")
    expect(illustrateur?.salaire).toBe(0)
  })

  it("classe un métier connu sans NaN", () => {
    const ranked = rankMetiers(catalog.metiers, { etudes: "court", lieu: "dehors" }, [3, 15])
    expect(ranked).toHaveLength(1138)
    expect(ranked[0].pct).toBeGreaterThanOrEqual(ranked[1].pct)
    expect(ranked.every((item) => Number.isFinite(item.pct) && item.pct >= 0 && item.pct <= 100)).toBe(true)
  })

  it("formule le bandeau de résultats", () => {
    expect(bannerCorrespondance(12, 1138)).toBe(
      "12 métiers correspondent bien à tes réponses (70\u202F% ou plus, sur 1\u202F138)",
    )
    expect(bannerCorrespondance(0, 1138)).toContain("Aucun métier")
    expect(bannerCorrespondance(1, 1138)).toContain("1 métier correspond")
  })
})
