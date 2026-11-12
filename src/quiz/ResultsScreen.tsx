import { useMemo, useState } from "react"
import { DATASET } from "../generated/dataset.ts"
import { bannerCorrespondance, formatNombre } from "../lib/format.ts"
import { hasBit, norm, rankMetiers } from "../lib/scoring.ts"
import { FAMILIES, PAGE_SIZE, SECTEURS, SEUIL_BIEN, TOTAL_ETAPES } from "../lib/vocab.ts"
import type { ShareCardInput } from "../lib/share.ts"
import { useCatalog } from "../state/CatalogProvider.tsx"
import { useQuiz } from "../state/QuizProvider.tsx"
import { MetierCard } from "../components/MetierCard.tsx"
import { ShareDialog } from "../components/ShareDialog.tsx"
import { Button } from "../components/ui/button.tsx"
import { QuizChrome } from "./QuizScreens.tsx"

const EMPTY_CARD: ShareCardInput = { families: [], top: [], bons: 0, total: DATASET.count }

export function ResultsScreen() {
  const quiz = useQuiz()
  const catalog = useCatalog()
  const [recherche, setRecherche] = useState("")
  const [secteur, setSecteur] = useState("all")
  const [shown, setShown] = useState(PAGE_SIZE)
  const [shareOpen, setShareOpen] = useState(false)

  const ranked = useMemo(
    () => (catalog.status === "ready" ? rankMetiers(catalog.metiers, quiz.answers, quiz.interets) : []),
    [catalog.status, catalog.metiers, quiz.answers, quiz.interets],
  )

  const filtered = useMemo(() => {
    const query = norm(recherche.trim())
    const secteurIndex = secteur === "all" ? -1 : Number(secteur)
    return ranked.filter((metier) => {
      if (secteurIndex >= 0 && !hasBit(metier.secteurs, secteurIndex)) return false
      if (!query) return true
      return norm(`${metier.nom} ${metier.accroche} ${metier.mots}`).includes(query)
    })
  }, [ranked, recherche, secteur])

  const total = catalog.metiers.length || DATASET.count
  const bons = filtered.filter((metier) => metier.pct >= SEUIL_BIEN).length
  const filteredOn = recherche.trim() !== "" || secteur !== "all"
  const visible = filtered.slice(0, shown)
  const card = useMemo<ShareCardInput>(() => {
    const families = FAMILIES.filter((_, index) => quiz.familles.includes(index)).map((family) => family.titre)
    return {
      families,
      top: ranked.slice(0, 3).map((metier) => ({ nom: metier.nom, pct: metier.pct })),
      bons: ranked.filter((metier) => metier.pct >= SEUIL_BIEN).length,
      total,
    }
  }, [quiz.familles, ranked, total])

  return (
    <QuizChrome current={TOTAL_ETAPES} caption="Tes résultats">
      <div className="grid gap-4">
        <div className="rounded-3xl bg-accent px-4 py-5 text-white">
          <h1 className="font-display text-3xl leading-tight font-semibold text-balance">Tes pistes</h1>
          <p data-testid="results-banner" className="mt-3 text-lg leading-snug" role="status">
            {catalog.status === "ready" ? bannerCorrespondance(bons, total) : "Calcul des correspondances…"}
          </p>
          {filteredOn && catalog.status === "ready" ? (
            <p className="mt-2 text-sm text-white/90">
              {formatNombre(filtered.length)} métier{filtered.length > 1 ? "s" : ""} dans cette recherche.
            </p>
          ) : null}
        </div>
        <p className="text-sm leading-relaxed text-muted">
          Voici les métiers qui correspondent le mieux à tes réponses. Ce n'est pas un verdict : c'est une piste pour explorer. Ouvre une fiche, puis va lire la page Onisep pour le détail.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setShareOpen(true)} disabled={catalog.status !== "ready"}>
            Partager mon profil
          </Button>
        </div>
        <div className="grid gap-3">
          <label className="grid gap-1 text-sm font-semibold" htmlFor="recherche-resultats">
            Rechercher un métier
            <input
              id="recherche-resultats"
              value={recherche}
              placeholder="Un nom ou un mot-clé"
              className="min-h-12 rounded-2xl border border-line bg-card px-3 text-base font-normal"
              onChange={(event) => {
                setRecherche(event.target.value)
                setShown(PAGE_SIZE)
              }}
            />
          </label>
          <label className="grid gap-1 text-sm font-semibold" htmlFor="secteur-resultats">
            Filtrer par secteur
            <select
              id="secteur-resultats"
              value={secteur}
              className="min-h-12 rounded-2xl border border-line bg-card px-3 text-base font-normal"
              onChange={(event) => {
                setSecteur(event.target.value)
                setShown(PAGE_SIZE)
              }}
            >
              <option value="all">Tous les secteurs</option>
              {SECTEURS.map((label, index) => (
                <option key={label} value={String(index)}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
        {catalog.status === "loading" ? (
          <p role="status" className="rounded-3xl border border-line bg-card p-4">
            Chargement des {formatNombre(DATASET.count)} métiers…
          </p>
        ) : null}
        {catalog.status === "error" ? (
          <div role="alert" className="rounded-3xl border border-line bg-card p-4">
            <p>{catalog.error}</p>
            <Button className="mt-3" onClick={catalog.reload}>
              Réessayer
            </Button>
          </div>
        ) : null}
        {catalog.status === "ready" && filtered.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-line p-4">Aucun métier ne correspond à cette recherche.</p>
        ) : null}
        <div className="grid gap-3">
          {visible.map((metier, index) => (
            <MetierCard
              key={metier.id}
              metier={metier}
              rank={index + 1}
              best={index === 0 && !filteredOn}
              expandable
            />
          ))}
        </div>
        {shown < filtered.length ? (
          <Button
            variant="outline"
            onClick={() => setShown((count) => count + PAGE_SIZE)}
          >
            Voir plus ({formatNombre(Math.min(PAGE_SIZE, filtered.length - shown))} de plus, {formatNombre(filtered.length)} au total)
          </Button>
        ) : null}
        <Button variant="ghost" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          Haut de page
        </Button>
      </div>
      <ShareDialog open={shareOpen} onClose={() => setShareOpen(false)} card={shareOpen ? card : EMPTY_CARD} />
    </QuizChrome>
  )
}
