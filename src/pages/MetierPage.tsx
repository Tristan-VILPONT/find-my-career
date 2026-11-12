import { Link, useParams } from "react-router-dom"
import { Heart } from "lucide-react"
import { findMetier } from "../lib/catalog.ts"
import { hasProfile, scorer } from "../lib/scoring.ts"
import { useCatalog } from "../state/CatalogProvider.tsx"
import { useLibrary } from "../state/LibraryProvider.tsx"
import { useQuiz } from "../state/QuizProvider.tsx"
import { FicheBody } from "../components/FicheBody.tsx"
import { Button } from "../components/ui/button.tsx"

export function MetierPage() {
  const { id = "" } = useParams()
  const catalog = useCatalog()
  const quiz = useQuiz()
  const library = useLibrary()
  const metier = catalog.status === "ready" ? findMetier(catalog.metiers, id) : undefined
  const profile = hasProfile(quiz.answers, quiz.interets)
  const score = metier && profile ? scorer(metier, quiz.answers, quiz.interets) : undefined

  return (
    <article className="mx-auto grid w-full max-w-2xl gap-4">
      <p>
        <Link className="text-sm font-semibold text-accent underline-offset-4 hover:underline" to="/explorer">
          Explorer tous les métiers
        </Link>
      </p>
      {catalog.status === "loading" ? <p role="status">Chargement de la fiche…</p> : null}
      {catalog.status === "error" ? (
        <div role="alert">
          <p>{catalog.error}</p>
          <Button className="mt-3" onClick={catalog.reload}>
            Réessayer
          </Button>
        </div>
      ) : null}
      {catalog.status === "ready" && !metier ? (
        <div>
          <h1 className="font-display text-3xl font-semibold">Métier introuvable</h1>
          <p className="mt-2 text-muted">Cette fiche n'est pas dans le jeu de données chargé.</p>
        </div>
      ) : null}
      {metier ? (
        <>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h1 className="font-display text-4xl leading-tight font-semibold text-balance">{metier.nom}</h1>
            {score ? <p className="text-3xl font-semibold text-accent tabular-nums">{score.pct}&nbsp;%</p> : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" aria-pressed={library.isFavorite(metier.id)} onClick={() => library.toggleFavorite(metier.id)}>
              <Heart aria-hidden="true" className={library.isFavorite(metier.id) ? "fill-accent text-accent" : ""} size={18} />
              {library.isFavorite(metier.id) ? "Dans tes favoris" : "Ajouter aux favoris"}
            </Button>
            <Button variant={library.isCompared(metier.id) ? "default" : "outline"} size="sm" aria-pressed={library.isCompared(metier.id)} onClick={() => library.toggleCompare(metier.id)}>
              {library.isCompared(metier.id) ? "Dans la comparaison" : "Comparer"}
            </Button>
          </div>
          <FicheBody metier={metier} score={score} />
        </>
      ) : null}
    </article>
  )
}
