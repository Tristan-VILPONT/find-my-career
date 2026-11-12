import { DATASET } from "../generated/dataset.ts"
import { formatNombre, formatSalaire } from "./format.ts"
import { ficheCrit, indicesFromMask, labelsFromMask, unpackCrit } from "./scoring.ts"
import { grilleRows, marcheRows, metierscope, sourcesPhrase } from "./grille.ts"
import { SITE, SITE_AUTHOR, SITE_DESCRIPTION, SITE_JSONLD, SITE_OG_IMAGE, SITE_TITLE } from "./site.ts"
import type { Metier } from "./types.ts"
import { INTERETS, NIVEAUX, SECTEURS, STATUTS, URL_DATA, ficheOnisep } from "./vocab.ts"

export const OG_IMAGE_WIDTH = 1200
export const OG_IMAGE_HEIGHT = 630

export type PageMeta = {
  path: string
  title: string
  description: string
  ogType: "website" | "article"
  jsonLd: unknown
}

export function canonical(path: string): string {
  if (!path || path === "/") return `${SITE.url}/`
  const clean = path.startsWith("/") ? path : `/${path}`
  return `${SITE.url}${clean}`
}

export function pageTitle(page?: string): string {
  if (!page) return SITE_TITLE
  return `${page} — ${SITE.name}`
}

export function websitePersonGraph(): unknown[] {
  return [
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
  ]
}

export const HOME_INTRO =
  "Tu n'as pas à savoir déjà ce que tu veux faire. À 15 ans, c'est normal. Ce quiz te demande ce qui t'attire et ce qui compte pour toi, puis il te propose des pistes parmi les fiches métiers de l'Onisep."

export const HOME_STEPS: [string, string][] = [
  ["Dis ce qui te ressemble", "D'abord quelques grandes familles, puis autant de centres d'intérêt officiels de l'Onisep que tu veux."],
  ["Réponds à 12 questions", "Les études, ton parcours (salarié, à ton compte, ta propre entreprise), le lieu de travail, le temps libre, la santé, l'utilité… À chaque fois, tu peux dire « peu importe »."],
  ["Explore tes métiers", "Un classement, des fiches, et un lien vers l'Onisep pour aller plus loin."],
]

export function aboutParagraphs(): string[] {
  const count = formatNombre(DATASET.count)
  return [
    `J'ai créé « ${SITE.name} » à partir d'une grille personnelle que je m'étais faite pour choisir mon métier : ce qui m'attirait, être utile aux autres, travailler dehors ou dans un bureau, le niveau d'études, le quotidien, le salaire, la possibilité de rester ou de bouger. J'aurais aimé avoir ça plus tôt, vers 15 ans, au collège ou au lycée, quand on te demande déjà « tu veux faire quoi plus tard ? ». Alors qu'au fond, la vraie question est plutôt « qu'est-ce qui compte pour toi ? ».`,
    `« ${SITE.name} » reprend cette idée. ${SITE.tagline}. Ce n'est pas un test psychologique et ce n'est pas un verdict. C'est une façon de parcourir les ${count} fiches métiers de l'Onisep avec tes critères, pour décider de manière plus éclairée.`,
    "Il n'y a pas de compte. Tes réponses, tes favoris et ta comparaison restent dans ton navigateur. Rien n'est envoyé à un serveur.",
  ]
}

export const FT_ABOUT =
  "Les données sur le marché du travail viennent de France Travail, en open data (Licence Ouverte) : le ROME 4.0 (version d'octobre 2026) pour les conditions de travail et les statuts d'emploi, et l'enquête Besoins en Main-d'Œuvre (BMO) 2026 pour les projets de recrutement et les difficultés de recrutement. La BMO compte par famille de métiers (FAP-2021), reliée au ROME par la table de passage de la Dares : ce sont les chiffres de la famille, pas du métier exact. Les critères de ma grille (parcours salarié → indépendant → propriétaire, investissement, temps libre, santé) sont déduits de ces données et des fiches Onisep, et marqués « (estimation) » quand ce n'est pas écrit noir sur blanc."

export function aboutSourceParagraphs(): string[] {
  return [
    `Les fiches viennent du jeu Données Onisep (Idéo-Fiches métiers) – licence ODbL, extraction d'${DATASET.sourceLabel}. L'Onisep met à jour ce jeu environ dix fois par an sur data.gouv.fr. Il n'y a pas de clé d'API à demander : l'API Onisep est en maintenance, donc le site lit une copie statique.`,
    "Le niveau d'études, les statuts, les centres d'intérêt, les secteurs et le salaire de débutant (quand un montant mensuel brut est clairement écrit) viennent directement des fiches. Le lieu de travail, le télétravail, les horaires, l'utilité, la résistance aux crises et aux robots, et la contrainte géographique sont parfois des estimations déduites des textes. Une estimation est marquée comme telle et pèse deux fois moins dans le score. Elle peut être fausse : la page Onisep reste la référence.",
    FT_ABOUT,
    "Le jeu de données dérivé publié avec ce site reste sous licence ODbL : si tu le réutilises, tu dois le partager aux mêmes conditions et citer l'Onisep.",
  ]
}

const STATIC: Record<string, { title: string; description: string; heading: string }> = {
  "/": {
    title: SITE.name,
    description: SITE_DESCRIPTION,
    heading: SITE.name,
  },
  "/a-propos": {
    title: pageTitle("À propos"),
    description: `Pourquoi j'ai créé « ${SITE.name} », comment le quiz marche, et d'où viennent les ${formatNombre(DATASET.count)} fiches Onisep.`,
    heading: "À propos",
  },
  "/explorer": {
    title: pageTitle("Explorer les métiers"),
    description: `Parcours les ${formatNombre(DATASET.count)} fiches métiers de l'Onisep. Cherche un nom, ou filtre par secteur, niveau d'études et centre d'intérêt.`,
    heading: "Explorer tous les métiers",
  },
  "/favoris": {
    title: pageTitle("Favoris"),
    description: "Retrouve ici les métiers que tu as mis de côté. Tes favoris restent dans ton navigateur, rien n'est envoyé à un serveur.",
    heading: "Tes favoris",
  },
  "/comparer": {
    title: pageTitle("Comparer"),
    description: "Compare côte à côte les métiers qui t'intéressent, à partir des fiches Onisep.",
    heading: "Comparer",
  },
}

export function metierDescription(metier: Metier): string {
  const text = metier.accroche.trim()
  if (text.length <= 200) return text
  const cut = text.slice(0, 197)
  const lastSpace = cut.lastIndexOf(" ")
  return `${cut.slice(0, lastSpace > 120 ? lastSpace : 197).trim()}…`
}

export function metierRows(metier: Metier): { label: string; value: string }[] {
  const statuts = labelsFromMask(metier.statuts, STATUTS)
  const secteurs = labelsFromMask(metier.secteurs, SECTEURS)
  const criteres = ficheCrit(unpackCrit(metier.crit))
  return [
    { label: "Niveau d'études", value: NIVEAUX[metier.niveau] ?? "" },
    statuts.length > 0 ? { label: "Statuts", value: statuts.join(", ") } : null,
    metier.salaire > 0 ? { label: "Salaire débutant (indicatif)", value: formatSalaire(metier.salaire) } : null,
    { label: "Secteurs", value: secteurs.join(", ") || "—" },
    ...criteres,
  ].filter((row): row is { label: string; value: string } => row !== null && row.value !== "")
}

export function metierGrilleRows(metier: Metier): { label: string; value: string }[] {
  return grilleRows(metier)
}

export function metierMarcheRows(metier: Metier): { label: string; value: string }[] {
  return marcheRows(metier)
}

export function metierSources(metier: Metier): string {
  return sourcesPhrase(metier)
}

export function metierRomeLinks(metier: Metier): { code: string; url: string }[] {
  return (metier.g?.r ?? []).map((code) => ({ code, url: metierscope(code) }))
}

export function metierInterets(metier: Metier): string[] {
  return indicesFromMask(metier.interets, INTERETS.length)
    .map((index) => INTERETS[index])
    .filter((label): label is string => Boolean(label))
}

export function occupationJsonLd(metier: Metier, path: string): unknown {
  const occupation: Record<string, unknown> = {
    "@type": "Occupation",
    "@id": `${canonical(path)}#occupation`,
    name: metier.nom,
    description: metier.accroche,
    url: canonical(path),
    sameAs: ficheOnisep(metier.id),
    occupationLocation: { "@type": "Country", "name": "France" },
    mainEntityOfPage: { "@type": "WebPage", "@id": canonical(path), url: canonical(path), isPartOf: { "@id": `${SITE.url}/#site` } },
  }
  const niveau = NIVEAUX[metier.niveau]
  if (niveau) occupation.educationRequirements = niveau
  if (metier.g?.r && metier.g.r.length > 0) {
    occupation.occupationalCategory = metier.g.r.map((code, index) => ({
      "@type": "CategoryCode",
      codeValue: code,
      name: metier.g?.rl?.[index] ?? code,
      inCodeSet: { "@type": "CategoryCodeSet", name: "ROME 4.0 (France Travail)" },
    }))
  }
  if (metier.salaire > 0) {
    occupation.estimatedSalary = {
      "@type": "MonetaryAmountDistribution",
      name: "Salaire débutant indicatif (brut mensuel)",
      currency: "EUR",
      duration: "P1M",
      median: metier.salaire,
    }
  }
  return occupation
}

export function metaForPath(pathname: string, metier?: Metier): PageMeta {
  const path = pathname.split("?")[0] || "/"
  if (path.startsWith("/metier/")) {
    if (metier) {
      return {
        path: `/metier/${metier.id}`,
        title: pageTitle(metier.nom),
        description: metierDescription(metier),
        ogType: "article",
        jsonLd: { "@context": "https://schema.org", "@graph": [...websitePersonGraph(), occupationJsonLd(metier, `/metier/${metier.id}`)] },
      }
    }
    return {
      path,
      title: pageTitle("Métier introuvable"),
      description: SITE_DESCRIPTION,
      ogType: "website",
      jsonLd: { "@context": "https://schema.org", "@graph": websitePersonGraph() },
    }
  }
  const staticPage = STATIC[path]
  if (staticPage) {
    return {
      path,
      title: staticPage.title,
      description: staticPage.description,
      ogType: "website",
      jsonLd: path === "/" ? JSON.parse(SITE_JSONLD) : { "@context": "https://schema.org", "@graph": websitePersonGraph() },
    }
  }
  return {
    path,
    title: pageTitle("Page introuvable"),
    description: SITE_DESCRIPTION,
    ogType: "website",
    jsonLd: { "@context": "https://schema.org", "@graph": websitePersonGraph() },
  }
}

export function staticPageHeading(path: string): string {
  return STATIC[path]?.heading ?? SITE.name
}

export function mainPages(): { path: string; title: string; description: string }[] {
  return ["/", "/a-propos", "/explorer"].map((path) => {
    const page = STATIC[path]
    return { path, title: page.title, description: page.description }
  })
}

export { SITE, SITE_AUTHOR, SITE_DESCRIPTION, SITE_OG_IMAGE, URL_DATA, ficheOnisep, DATASET, formatNombre }
