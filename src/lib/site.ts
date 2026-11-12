/** Identité du site. L'URL canonique est le domaine principal .fr. */
export const SITE = {
  name: "Quel métier me correspond ?",
  nameLines: ["Quel métier", "me correspond ?"] as const,
  shortName: "Quel métier ?",
  tagline: "Trouve un métier qui te ressemble",
  domain: "quelmetiermecorrespond.fr",
  url: "https://quelmetiermecorrespond.fr",
} as const

export const SITE_AUTHOR = "Tristan VILPONT"

/** Dépôt public du code, de la méthode et des guides. */
export const SOURCE_REPO_URL = "https://github.com/Tristan-VILPONT/find-my-career"

export const SITE_DESCRIPTION = `${SITE.tagline}. Quiz gratuit pour les ados, à partir des fiches Onisep, sans compte.`

export const SITE_TITLE = SITE.name

export const SITE_OG_IMAGE = `${SITE.url}/og.png`

export const SITE_JSONLD = JSON.stringify({
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE.url}/#site`,
      name: SITE.name,
      url: `${SITE.url}/`,
      description: SITE_DESCRIPTION,
      inLanguage: "fr-FR",
      author: { "@id": `${SITE.url}/#auteur` },
      publisher: { "@id": `${SITE.url}/#auteur` },
    },
    {
      "@type": "Person",
      "@id": `${SITE.url}/#auteur`,
      name: SITE_AUTHOR,
      url: `${SITE.url}/a-propos`,
    },
  ],
})

/** Remplacements appliqués à index.html par Vite. La valeur ne vit que dans SITE. */
export const SITE_HTML = {
  "%SITE_TITLE%": SITE_TITLE,
  "%SITE_DESCRIPTION%": SITE_DESCRIPTION,
  "%SITE_NAME%": SITE.name,
  "%SITE_TAGLINE%": SITE.tagline,
  "%SITE_URL%": SITE.url,
  "%SITE_AUTHOR%": SITE_AUTHOR,
  "%SITE_OG_IMAGE%": SITE_OG_IMAGE,
  "%SITE_JSONLD%": SITE_JSONLD,
} as const
