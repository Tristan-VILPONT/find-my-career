import fs from "node:fs"
import path from "node:path"
import type { Plugin } from "vite"
import {
  DATASET,
  HOME_INTRO,
  HOME_STEPS,
  SITE,
  SITE_AUTHOR,
  URL_DATA,
  aboutParagraphs,
  aboutSourceParagraphs,
  canonical,
  ficheOnisep,
  formatNombre,
  mainPages,
  metaForPath,
  metierGrilleRows,
  metierInterets,
  metierMarcheRows,
  metierRomeLinks,
  metierRows,
  metierSources,
  staticPageHeading,
  type PageMeta,
} from "../src/lib/seo.ts"
import type { CatalogFile, Metier } from "../src/lib/types.ts"
import { SOURCE_REPO_URL } from "../src/lib/site.ts"
import { FT_SOURCES } from "../src/generated/dataset.ts"

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

function applyHead(html: string, meta: PageMeta): string {
  const url = canonical(meta.path)
  const jsonLd = JSON.stringify(meta.jsonLd).replace(/</g, "\\u003c")
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(meta.title)}</title>`)
  html = html.replace(
    /<meta name="description" content="[^"]*"\s*\/?>/,
    `<meta name="description" content="${escapeHtml(meta.description)}" />`,
  )
  html = html.replace(/<link rel="canonical" href="[^"]*"\s*\/?>/, `<link rel="canonical" href="${escapeHtml(url)}" />`)
  html = html.replace(/<meta property="og:title" content="[^"]*"\s*\/?>/, `<meta property="og:title" content="${escapeHtml(meta.title)}" />`)
  html = html.replace(
    /<meta property="og:description" content="[^"]*"\s*\/?>/,
    `<meta property="og:description" content="${escapeHtml(meta.description)}" />`,
  )
  html = html.replace(/<meta property="og:url" content="[^"]*"\s*\/?>/, `<meta property="og:url" content="${escapeHtml(url)}" />`)
  html = html.replace(/<meta property="og:type" content="[^"]*"\s*\/?>/, `<meta property="og:type" content="${meta.ogType}" />`)
  html = html.replace(/<meta name="twitter:title" content="[^"]*"\s*\/?>/, `<meta name="twitter:title" content="${escapeHtml(meta.title)}" />`)
  html = html.replace(
    /<meta name="twitter:description" content="[^"]*"\s*\/?>/,
    `<meta name="twitter:description" content="${escapeHtml(meta.description)}" />`,
  )
  html = html.replace(
    /<script type="application\/ld\+json" id="jsonld">[\s\S]*?<\/script>/,
    `<script type="application/ld+json" id="jsonld">${jsonLd}</script>`,
  )
  return html
}

function setRoot(html: string, inner: string): string {
  const start = html.indexOf('<div id="root">')
  const end = html.indexOf("<noscript>")
  if (start < 0 || end < 0) throw new Error("Impossible de trouver #root dans index.html")
  return `${html.slice(0, start)}<div id="root">\n${inner}\n    </div>\n    ${html.slice(end)}`
}

function footerHtml(): string {
  return `      <footer style="margin-top:2rem;font-size:0.95rem">
        <p><a href="${escapeHtml(URL_DATA)}">${escapeHtml(DATASET.attribution)}</a> · <a href="${escapeHtml(FT_SOURCES.rome.url)}">France Travail : ROME 4.0</a> et <a href="${escapeHtml(FT_SOURCES.bmo.url)}">BMO ${escapeHtml(FT_SOURCES.bmo.annee)}</a> – Licence Ouverte. Fiches d'${escapeHtml(DATASET.sourceLabel)}. Aucune donnée personnelle n'est envoyée.</p>
      </footer>`
}

function pageShell(inner: string): string {
  return `      <main id="contenu" style="max-width:40rem;margin:0 auto;padding:2.5rem 1.25rem">
${inner}
${footerHtml()}
      </main>`
}

function homeBody(): string {
  const count = formatNombre(DATASET.count)
  const steps = HOME_STEPS.map(
    ([title, detail], index) =>
      `          <li><h2>${index + 1}. ${escapeHtml(title)}</h2><p>${escapeHtml(detail)}</p></li>`,
  ).join("\n")
  return pageShell(`        <article>
          <h1>${escapeHtml(SITE.name)}</h1>
          <p>${escapeHtml(SITE.tagline)}</p>
          <p>${escapeHtml(HOME_INTRO.replace("les fiches métiers de l'Onisep", `les ${count} métiers référencés par l'Onisep`))}</p>
          <ol>
${steps}
          </ol>
          <p>Tes réponses restent dans ton navigateur. Rien n'est envoyé à un serveur. <a href="/explorer">Explorer tous les métiers</a> · <a href="/a-propos">À propos</a></p>
        </article>`)
}

function aboutBody(): string {
  const paragraphs = aboutParagraphs()
    .map((text) => `          <p>${escapeHtml(text)}</p>`)
    .join("\n")
  const sources = aboutSourceParagraphs()
    .map((text, index) => {
      if (index === 0) {
        return `          <p>Les fiches viennent du jeu <a href="${escapeHtml(URL_DATA)}">Données Onisep (Idéo-Fiches métiers) – licence ODbL</a>, extraction d'${escapeHtml(DATASET.sourceLabel)}. L'Onisep met à jour ce jeu environ dix fois par an sur data.gouv.fr. Il n'y a pas de clé d'API à demander : l'API Onisep est en maintenance, donc le site lit une copie statique.</p>`
      }
      return `          <p>${escapeHtml(text)}</p>`
    })
    .join("\n")
  return pageShell(`        <article>
          <h1>À propos</h1>
${paragraphs}
          <p>Le code et la méthode sont en accès libre : <a href="${escapeHtml(SOURCE_REPO_URL)}" target="_blank" rel="noreferrer">Code source et méthode libres</a>.</p>
          <h2>D'où viennent les infos</h2>
${sources}
          <p>Une idée, une remarque, un métier qui manque ? Écris-moi : <a href="mailto:contact@quelmetiermecorrespond.fr">contact@quelmetiermecorrespond.fr</a></p>
        </article>`)
}

function simpleBody(pathName: string, intro: string): string {
  return pageShell(`        <article>
          <h1>${escapeHtml(staticPageHeading(pathName))}</h1>
          <p>${escapeHtml(intro)}</p>
        </article>`)
}

function metierBody(metier: Metier): string {
  const rows = metierRows(metier)
    .map((row) => `            <div><dt>${escapeHtml(row.label)}</dt><dd>${escapeHtml(row.value)}</dd></div>`)
    .join("\n")
  const interets = metierInterets(metier)
  const interetsHtml =
    interets.length === 0
      ? `          <p>Aucun centre d'intérêt indiqué sur la fiche.</p>`
      : `          <ul>${interets.map((label) => `<li>${escapeHtml(label)}</li>`).join("")}</ul>`
  const dl = (items: { label: string; value: string }[]) =>
    items.map((row) => `            <div><dt>${escapeHtml(row.label)}</dt><dd>${escapeHtml(row.value)}</dd></div>`).join("\n")
  const grille = metierGrilleRows(metier)
  const grilleHtml = grille.length > 0 ? `          <h2>Les critères de ta grille</h2>\n          <dl>\n${dl(grille)}\n          </dl>\n` : ""
  const marche = metierMarcheRows(metier)
  const links = metierRomeLinks(metier)
    .map((link) => `<a href="${escapeHtml(link.url)}">Fiche ROME ${escapeHtml(link.code)} sur France Travail</a>`)
    .join(" · ")
  const marcheHtml =
    marche.length > 0
      ? `          <h2>Le marché du travail</h2>\n          <dl>\n${dl(marche)}\n          </dl>\n${links ? `          <p>${links}</p>\n` : ""}          <p>${escapeHtml(metierSources(metier))}</p>\n`
      : ""
  const accroche = metier.accroche ? `          <p>${escapeHtml(metier.accroche)}</p>\n` : ""
  return pageShell(`        <article>
          <p><a href="/explorer">Explorer tous les métiers</a></p>
          <h1>${escapeHtml(metier.nom)}</h1>
${accroche}          <dl>
${rows}
          </dl>
${grilleHtml}${marcheHtml}          <h2>Centres d'intérêt Onisep</h2>
${interetsHtml}
          <p><a href="${escapeHtml(ficheOnisep(metier.id))}">Lire la fiche sur onisep.fr</a></p>
        </article>`)
}

function writePage(dist: string, template: string, filePath: string, meta: PageMeta, body: string) {
  const html = setRoot(applyHead(template, meta), body)
  const destination = path.join(dist, filePath)
  fs.mkdirSync(path.dirname(destination), { recursive: true })
  fs.writeFileSync(destination, html)
}

type Published = { fiches: Record<string, string> }
type Aliases = { alias: Record<string, string> }

/**
 * Protège les URL déjà publiées : si une fiche disparaît (identifiant Onisep changé ou fiche retirée),
 * on écrit une redirection 301 vers le nouvel identifiant (data/source/id-aliases.json) ou vers une
 * recherche dans l'explorateur. Les règles sont placées avant la règle SPA de _redirects.
 */
export function legacyRedirects(root: string, ids: Set<string>): string[] {
  const published = JSON.parse(fs.readFileSync(path.join(root, "data/fixtures/published-ids.json"), "utf8")) as Published
  const aliasFile = path.join(root, "data/source/id-aliases.json")
  const aliases = fs.existsSync(aliasFile) ? (JSON.parse(fs.readFileSync(aliasFile, "utf8")) as Aliases).alias : {}
  const rules: string[] = []
  for (const [oldId, nom] of Object.entries(published.fiches)) {
    if (ids.has(oldId)) continue
    const target = aliases[oldId]
    if (target && ids.has(target)) {
      rules.push(`/metier/${oldId} /metier/${target} 301`)
    } else {
      rules.push(`/metier/${oldId} /explorer?q=${encodeURIComponent(nom.split("/")[0])} 301`)
    }
  }
  return rules
}

function writeRedirects(dist: string, rules: string[]) {
  const file = path.join(dist, "_redirects")
  const existing = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : ""
  if (rules.length === 0) return
  fs.writeFileSync(file, `# Anciennes fiches (généré au build)\n${rules.join("\n")}\n${existing}`)
}

function writeSitemap(dist: string, metiers: Metier[]) {
  const urls = [...mainPages().map((page) => canonical(page.path)), ...metiers.map((metier) => canonical(`/metier/${metier.id}`))]
  const body = urls
    .map((loc) => `  <url><loc>${escapeHtml(loc)}</loc></url>`)
    .join("\n")
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`
  fs.writeFileSync(path.join(dist, "sitemap.xml"), xml)
  return urls.length
}

export function prerenderPlugin(): Plugin {
  let outDir = path.resolve("dist")
  return {
    name: "prerender-seo",
    apply: "build",
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir)
    },
    closeBundle() {
      const template = fs.readFileSync(path.join(outDir, "index.html"), "utf8")
      const catalog = JSON.parse(fs.readFileSync(path.join(outDir, "data/catalog.json"), "utf8")) as CatalogFile
      if (!Array.isArray(catalog.metiers) || catalog.metiers.length < 1000) {
        throw new Error("Catalogue incomplet, pré-rendu annulé.")
      }

      writePage(outDir, template, "index.html", metaForPath("/"), homeBody())
      writePage(outDir, template, "a-propos.html", metaForPath("/a-propos"), aboutBody())
      writePage(
        outDir,
        template,
        "explorer.html",
        metaForPath("/explorer"),
        simpleBody("/explorer", `${formatNombre(DATASET.count)} fiches Onisep. Cherche un nom, ou filtre par secteur, niveau d'études et centre d'intérêt.`),
      )
      writePage(
        outDir,
        template,
        "favoris.html",
        metaForPath("/favoris"),
        simpleBody("/favoris", "Retrouve ici les métiers que tu as mis de côté. Tes favoris restent dans ton navigateur, rien n'est envoyé à un serveur."),
      )
      writePage(
        outDir,
        template,
        "comparer.html",
        metaForPath("/comparer"),
        simpleBody("/comparer", "Compare côte à côte les métiers qui t'intéressent, à partir des fiches Onisep."),
      )

      for (const metier of catalog.metiers) {
        writePage(outDir, template, path.join("metier", `${metier.id}.html`), metaForPath(`/metier/${metier.id}`, metier), metierBody(metier))
      }

      const legacy = legacyRedirects(path.resolve(outDir, ".."), new Set(catalog.metiers.map((metier) => metier.id)))
      writeRedirects(outDir, legacy)
      if (legacy.length > 0) console.info(`Redirections d'anciennes fiches : ${legacy.length}`)

      const count = writeSitemap(outDir, catalog.metiers)
      console.info(`Pré-rendu : ${catalog.metiers.length} fiches métiers, ${count} URLs dans sitemap.xml (auteur ${SITE_AUTHOR}).`)
    },
  }
}
