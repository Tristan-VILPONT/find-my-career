import { findMetier } from "../lib/catalog.ts"
import { hasProfile, scorer } from "../lib/scoring.ts"
import type { RankedMetier } from "../lib/types.ts"
import { useCatalog } from "../state/CatalogProvider.tsx"
import { useLibrary } from "../state/LibraryProvider.tsx"
import { useQuiz } from "../state/QuizProvider.tsx"
import { MetierCard } from "../components/MetierCard.tsx"

export function FavorisPage() {
  const catalog = useCatalog()
  const library = useLibrary()
  const quiz = useQuiz()
  const profile = hasProfile(quiz.answers, quiz.interets)
  const metiers: RankedMetier[] =
    catalog.status === "ready"
      ? library.favorites
          .map((id) => findMetier(catalog.metiers, id))
          .filter((metier) => metier !== undefined)
          .map((metier) => {
            const score = profile ? scorer(metier, quiz.answers, quiz.interets) : { pct: 0, raisons: [], communs: [] }
            return { ...metier, ...score }
          })
          .sort((a, b) => (profile ? b.pct - a.pct : a.nom.localeCompare(b.nom, "fr")))
      : []

  return (
    <div className="mx-auto grid w-full max-w-xl gap-4">
      <h1 className="font-display text-4xl font-semibold">Tes favoris</h1>
      <p className="text-muted">Ils restent dans ce navigateur. Personne d'autre ne les voit.</p>
      {catalog.status === "loading" ? <p role="status">Chargement…</p> : null}
      {catalog.status === "ready" && metiers.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-line p-4">
          Tu n'as pas encore de favoris. Appuie sur le cœur d'un métier pour le garder ici.
        </p>
      ) : null}
      <div className="grid gap-3">
        {metiers.map((metier) => (
          <MetierCard key={metier.id} metier={metier} showScore={profile} expandable />
        ))}
      </div>
    </div>
  )
}
