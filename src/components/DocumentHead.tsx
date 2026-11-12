import { useEffect } from "react"
import { useLocation } from "react-router-dom"
import { findMetier } from "../lib/catalog.ts"
import { canonical, metaForPath, SITE, SITE_OG_IMAGE, type PageMeta } from "../lib/seo.ts"
import { useCatalog } from "../state/CatalogProvider.tsx"

function setNamed(selector: string, attr: "name" | "property" | "rel", key: string, content: string, contentAttr = "content") {
  const element =
    document.head.querySelector<HTMLMetaElement | HTMLLinkElement>(selector) ??
    document.head.appendChild(Object.assign(document.createElement(selector.startsWith('link') ? "link" : "meta"), { [attr]: key }))
  element.setAttribute(contentAttr, content)
}

function applyMeta(meta: PageMeta) {
  const url = canonical(meta.path)
  document.title = meta.title
  setNamed('meta[name="description"]', "name", "description", meta.description)
  setNamed('link[rel="canonical"]', "rel", "canonical", url, "href")
  setNamed('meta[property="og:title"]', "property", "og:title", meta.title)
  setNamed('meta[property="og:description"]', "property", "og:description", meta.description)
  setNamed('meta[property="og:url"]', "property", "og:url", url)
  setNamed('meta[property="og:type"]', "property", "og:type", meta.ogType)
  setNamed('meta[property="og:image"]', "property", "og:image", SITE_OG_IMAGE)
  setNamed('meta[property="og:site_name"]', "property", "og:site_name", SITE.name)
  setNamed('meta[name="twitter:card"]', "name", "twitter:card", "summary_large_image")
  setNamed('meta[name="twitter:title"]', "name", "twitter:title", meta.title)
  setNamed('meta[name="twitter:description"]', "name", "twitter:description", meta.description)
  setNamed('meta[name="twitter:image"]', "name", "twitter:image", SITE_OG_IMAGE)
  const script = document.getElementById("jsonld") ?? Object.assign(document.createElement("script"), { type: "application/ld+json", id: "jsonld" })
  script.textContent = JSON.stringify(meta.jsonLd).replace(/</g, "\\u003c")
  if (!script.parentNode) document.head.appendChild(script)
}

export function DocumentHead() {
  const { pathname } = useLocation()
  const catalog = useCatalog()
  const id = pathname.startsWith("/metier/") ? pathname.slice("/metier/".length).split("/")[0] : ""
  const metier = id && catalog.status === "ready" ? findMetier(catalog.metiers, id) : undefined
  const meta = metaForPath(pathname, metier)
  useEffect(() => {
    applyMeta(meta)
  }, [meta])
  return null
}
