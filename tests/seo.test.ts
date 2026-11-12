import { describe, expect, it } from "vitest"
import { canonical, metaForPath, pageTitle } from "../src/lib/seo.ts"
import { SITE, SITE_AUTHOR, SITE_HTML } from "../src/lib/site.ts"

describe("SEO", () => {
  it("construit des URL canoniques sur le .fr", () => {
    expect(canonical("/")).toBe("https://quelmetiermecorrespond.fr/")
    expect(canonical("/a-propos")).toBe("https://quelmetiermecorrespond.fr/a-propos")
    expect(canonical("/metier/579")).toBe("https://quelmetiermecorrespond.fr/metier/579")
  })

  it("titre les pages intérieures avec le nom du site", () => {
    expect(pageTitle("À propos")).toBe(`À propos — ${SITE.name}`)
    expect(metaForPath("/").title).toBe(SITE.name)
    expect(metaForPath("/a-propos").title).toContain("À propos")
  })

  it("remplace aussi les jetons auteur, image et JSON-LD", () => {
    expect(SITE_HTML["%SITE_AUTHOR%"]).toBe(SITE_AUTHOR)
    expect(SITE_HTML["%SITE_OG_IMAGE%"]).toBe(`${SITE.url}/og.png`)
    expect(SITE_HTML["%SITE_JSONLD%"]).toContain(SITE_AUTHOR)
  })
})
