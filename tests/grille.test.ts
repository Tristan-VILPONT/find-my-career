import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { BMO_NATIONAL, FT_SOURCES } from "../src/generated/dataset.ts"
import {
  FILTRES_GRILLE,
  grilleRows,
  marcheRows,
  parcoursComplet,
  scoreInvest,
  scoreParcours,
  scoreSante,
  scoreTempsLibre,
} from "../src/lib/grille.ts"
import { scorer } from "../src/lib/scoring.ts"
import { metaForPath } from "../src/lib/seo.ts"
import type { CatalogFile, Grille, Metier } from "../src/lib/types.ts"
import { QUESTIONS } from "../src/lib/vocab.ts"
import { legacyRedirects } from "../scripts/prerender.ts"

const catalog = JSON.parse(readFileSync("public/data/catalog.json", "utf8")) as CatalogFile
const byId = (id: string) => catalog.metiers.find((item) => item.id === id) as Metier

describe("phase 2 : données France Travail", () => {
  it("relie chaque métier à une entrée de grille", () => {
    expect(catalog.metiers.every((item) => item.g && item.g.e.length === 3)).toBe(true)
  })

  it("couvre le ROME et la BMO comme prévu", () => {
    expect(catalog.metiers.filter((item) => item.g?.r?.length)).toHaveLength(928)
    expect(catalog.metiers.filter((item) => item.g?.b)).toHaveLength(878)
    expect(catalog.metiers.every((item) => (item.g?.r ?? []).every((code) => /^[A-N]\d{4}$/.test(code)))).toBe(true)
  })

  it("garde des chiffres BMO cohérents (sommes réelles, pourcentages bornés)", () => {
    for (const item of catalog.metiers) {
      const b = item.g?.b
      if (!b) continue
      expect(b.p).toBeGreaterThan(0)
      if (b.d !== null) expect(b.d).toBeGreaterThanOrEqual(0)
      if (b.d !== null) expect(b.d).toBeLessThanOrEqual(100)
      expect(b.f.length).toBeGreaterThan(0)
    }
    expect(BMO_NATIONAL.projets).toBeGreaterThan(2_000_000)
    expect(FT_SOURCES.bmo.annee).toBe("2026")
  })

  it("affiche la source et l'année sur la fiche", () => {
    const infirmier = byId("38")
    const rows = marcheRows(infirmier)
    expect(rows[0].label).toContain("2026")
    expect(rows.some((row) => row.value.includes("J1506"))).toBe(true)
  })

  it("donne au boulanger le parcours complet E → T → P", () => {
    const boulanger = byId("17")
    expect(boulanger.g?.e).toEqual([1, 1, 1])
    expect(parcoursComplet(boulanger.g)).toBe(true)
    const parcours = grilleRows(boulanger)[0]
    expect(parcours.value).toContain("Les trois étapes sont possibles")
  })

  it("marque toujours l'investissement comme une estimation", () => {
    for (const item of catalog.metiers.slice(0, 200)) {
      const row = grilleRows(item).find((line) => line.label.startsWith("Utile pour investir"))
      if (row) expect(row.value).toContain("(estimation)")
    }
  })
})

describe("phase 2 : score", () => {
  const g: Grille = { e: [1, 1, 2], eh: 3, i: 2, t: 3, th: 1, s: 1, sp: 1, sr: 1, ss: 1, sh: 1 }

  it("note le parcours E/T/P", () => {
    expect(scoreParcours(g, "salarie")).toBe(1)
    expect(scoreParcours(g, "oui")).toBe(1)
    expect(scoreParcours(g, "proprio")).toBe(0.6)
    expect(scoreParcours(g, "etp")).toBeCloseTo(0.87, 2)
    expect(scoreParcours(g, "egal")).toBeNull()
  })

  it("ne pénalise pas un critère inconnu", () => {
    expect(scoreTempsLibre(undefined, "oui")).toBeNull()
    expect(scoreInvest(0, "oui")).toBeNull()
    expect(scoreSante({ e: [1, 3, 3], eh: 1, i: 3 }, "oui")).toBeNull()
  })

  it("intègre les nouvelles questions au score", () => {
    const metier = byId("17")
    const detail = scorer(metier, { patron: "etp", tempslibre: "oui" }, [])
    expect(detail.pct).toBeGreaterThan(0)
    expect(detail.pct).toBeLessThanOrEqual(100)
    expect(QUESTIONS.map((question) => question.id)).toEqual(
      expect.arrayContaining(["patron", "invest", "tempslibre", "sante"]),
    )
    expect(QUESTIONS).toHaveLength(12)
  })

  it("propose des filtres qui trouvent des métiers", () => {
    for (const filtre of FILTRES_GRILLE) {
      expect(catalog.metiers.filter((item) => filtre.test(item.g)).length).toBeGreaterThan(10)
    }
  })
})

describe("phase 2 : SEO et anciennes URL", () => {
  it("ajoute le code ROME au JSON-LD", () => {
    const meta = metaForPath("/metier/579", byId("579"))
    expect(JSON.stringify(meta.jsonLd)).toContain("K1707")
  })

  it("garde toutes les URL publiées en phase 1", () => {
    const ids = new Set(catalog.metiers.map((item) => item.id))
    expect(legacyRedirects(process.cwd(), ids)).toEqual([])
    ids.delete("579")
    const rules = legacyRedirects(process.cwd(), ids)
    expect(rules).toHaveLength(1)
    expect(rules[0]).toMatch(/^\/metier\/579 \/explorer\?q=.+ 301$/)
  })
})
