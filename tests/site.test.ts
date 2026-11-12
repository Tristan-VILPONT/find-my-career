import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { SITE, SITE_DESCRIPTION, SITE_HTML, SITE_TITLE } from "../src/lib/site.ts"

describe("identité du site", () => {
  it("garde le nom, le raccourci et l'URL au même endroit", () => {
    expect(SITE.name).toBe("Quel métier me correspond ?")
    expect(SITE.nameLines.join(" ")).toBe(SITE.name)
    expect(SITE.shortName).toBe("Quel métier ?")
    expect(SITE.tagline).toBe("Trouve un métier qui te ressemble")
    expect(SITE.url).toBe(`https://${SITE.domain}`)
    expect(SITE_TITLE).toBe(SITE.name)
    expect(SITE_DESCRIPTION.startsWith(SITE.tagline)).toBe(true)
  })

  it("aligne le manifeste sur le nom", () => {
    const manifest = JSON.parse(readFileSync("public/manifest.webmanifest", "utf8")) as {
      name: string
      short_name: string
      description: string
    }
    expect(manifest.name).toBe(SITE.name)
    expect(manifest.short_name).toBe(SITE.shortName)
    expect(manifest.description).toBe(SITE_DESCRIPTION)
  })

  it("n'écrit le domaine que via le remplacement HTML", () => {
    const html = readFileSync("index.html", "utf8")
    expect(html).not.toContain(SITE.domain)
    expect(html).toContain("%SITE_URL%")
    expect(html).toContain("%SITE_TITLE%")
    const rendered = Object.entries(SITE_HTML).reduce(
      (current, [token, value]) => current.replaceAll(token, value),
      html,
    )
    expect(rendered).toContain(`<title>${SITE.name}</title>`)
    expect(rendered).toContain(`content="${SITE_DESCRIPTION}"`)
    expect(rendered).toContain(`href="${SITE.url}/"`)
    expect(rendered).toContain(`property="og:url" content="${SITE.url}/"`)
    expect(rendered).not.toContain("%SITE_")
  })

  it("nomme le paquet", () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf8")) as { name: string }
    expect(pkg.name).toBe("quel-metier-me-correspond")
  })
})