import { useEffect, useState, type ReactNode } from "react"
import { Menu, X } from "lucide-react"
import { Link, NavLink, useLocation } from "react-router-dom"
import { DATASET, FT_SOURCES } from "../generated/dataset.ts"
import { SITE } from "../lib/site.ts"
import { URL_DATA } from "../lib/vocab.ts"
import { LogoMark } from "./LogoMark.tsx"
import { useLibrary } from "../state/LibraryProvider.tsx"
import { Button } from "./ui/button.tsx"
import { DocumentHead } from "./DocumentHead.tsx"

const LINKS = [
  { to: "/", label: "Quiz", end: true },
  { to: "/explorer", label: "Explorer", end: false },
  { to: "/favoris", label: "Favoris", end: false },
  { to: "/a-propos", label: "À propos", end: false },
]

function navClass(active: boolean): string {
  return active
    ? "rounded-full bg-accent px-3 py-2 text-sm font-semibold text-white"
    : "rounded-full px-3 py-2 text-sm font-semibold text-ink hover:bg-black/5"
}

export function Layout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const library = useLibrary()
  const location = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])
  return (
    <div className="min-h-dvh">
      <DocumentHead />
      <a href="#contenu" className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-card focus:px-4 focus:py-2">
        Aller au contenu
      </a>
      <header className="sticky top-0 z-20 border-b border-line bg-paper/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <NavLink
            to="/"
            aria-label={SITE.name}
            className="flex min-w-0 items-center gap-2 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            onClick={() => setOpen(false)}
          >
            <LogoMark size={40} />
            <span className="font-display text-[0.95rem] leading-[1.05] font-semibold">
              {SITE.nameLines[0]}
              <br />
              {SITE.nameLines[1]}
            </span>
          </NavLink>
          <button
            type="button"
            className="inline-flex min-h-11 items-center gap-2 rounded-full px-3 font-semibold md:hidden"
            aria-expanded={open}
            aria-controls="menu-mobile"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X aria-hidden="true" size={18} /> : <Menu aria-hidden="true" size={18} />}
            Menu
          </button>
          <nav aria-label="Principal" className="hidden items-center gap-1 md:flex">
            {LINKS.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.end} className={({ isActive }) => navClass(isActive)}>
                {link.label}
                {link.to === "/favoris" && library.favorites.length > 0 ? ` (${library.favorites.length})` : ""}
              </NavLink>
            ))}
          </nav>
        </div>
        {open ? (
          <nav id="menu-mobile" aria-label="Principal" className="grid gap-1 border-t border-line px-4 py-3 md:hidden">
            {LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) => navClass(isActive)}
                onClick={() => setOpen(false)}
              >
                {link.label}
                {link.to === "/favoris" && library.favorites.length > 0 ? ` (${library.favorites.length})` : ""}
              </NavLink>
            ))}
          </nav>
        ) : (
          <nav id="menu-mobile" aria-label="Principal" className="hidden" />
        )}
      </header>
      <main id="contenu" className={`mx-auto w-full max-w-5xl px-4 py-6 ${library.compare.length > 0 ? "pb-32" : "pb-12"}`}>
        {children}
      </main>
      {library.compare.length > 0 ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-card/95 px-4 py-3 backdrop-blur">
          <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3">
            <p className="text-sm">
              {library.compare.length} métier{library.compare.length > 1 ? "s" : ""} à comparer
              {library.message ? <span className="mt-1 block text-accent-strong">{library.message}</span> : null}
            </p>
            <div className="flex gap-2">
              {library.compare.length < 2 ? (
                <Button size="sm" disabled>
                  Comparer
                </Button>
              ) : (
                <Button asChild size="sm">
                  <Link to="/comparer">Comparer</Link>
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={library.clearCompare}>
                Vider
              </Button>
            </div>
          </div>
        </div>
      ) : null}
      <footer className="border-t border-line px-4 py-8 text-sm leading-relaxed text-muted">
        <div className="mx-auto grid w-full max-w-5xl gap-2">
          <p>
            <a className="font-semibold text-ink underline decoration-accent underline-offset-4" href={URL_DATA}>
              Données Onisep (Idéo-Fiches métiers) – licence ODbL
            </a>
            {" · "}
            <a className="font-semibold text-ink underline decoration-accent underline-offset-4" href={FT_SOURCES.rome.url}>
              France Travail : ROME 4.0
            </a>
            {" et "}
            <a className="font-semibold text-ink underline decoration-accent underline-offset-4" href={FT_SOURCES.bmo.url}>
              BMO {FT_SOURCES.bmo.annee}
            </a>
            {" – Licence Ouverte"}
          </p>
          <p>
            Certains critères (lieu de travail, télétravail, horaires, utilité, résistance aux crises et aux robots, région, parcours, investissement, temps libre, santé) sont des estimations déduites des textes Onisep et du ROME. Quand la fiche n'est pas explicite, c'est signalé par « (estimation) » et ce critère compte deux fois moins. La page Onisep reste la référence.
          </p>
          <p>Fiches d'{DATASET.sourceLabel}. Aucune donnée personnelle n'est envoyée.</p>
        </div>
      </footer>
    </div>
  )
}
