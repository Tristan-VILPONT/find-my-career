import { Link } from "react-router-dom"
import { findMetier } from "../lib/catalog.ts"
import { formatSalaire } from "../lib/format.ts"
import { grilleRows, marcheRows } from "../lib/grille.ts"
import { ficheCrit, hasProfile, labelsFromMask, scorer, unpackCrit } from "../lib/scoring.ts"
import { NIVEAUX, SECTEURS, STATUTS } from "../lib/vocab.ts"
import { useCatalog } from "../state/CatalogProvider.tsx"
import { useLibrary } from "../state/LibraryProvider.tsx"
import { useQuiz } from "../state/QuizProvider.tsx"
import { Button } from "../components/ui/button.tsx"

export function ComparePage() {
  const catalog = useCatalog()
  const library = useLibrary()
  const quiz = useQuiz()
  const profile = hasProfile(quiz.answers, quiz.interets)
  const rows = library.compare
    .map((id) => (catalog.status === "ready" ? findMetier(catalog.metiers, id) : undefined))
    .filter((metier) => metier !== undefined)

  return (
    <div className="grid gap-4">
      <h1 className="font-display text-4xl font-semibold">Comparer</h1>
      {library.compare.length < 2 ? (
        <p className="max-w-xl rounded-3xl border border-dashed border-line p-4">
          Choisis 2 ou 3 métiers avec le bouton Comparer, depuis tes résultats, tes favoris ou l'explorateur.
        </p>
      ) : null}
      {catalog.status === "loading" ? <p role="status">Chargement des fiches…</p> : null}
      {rows.length >= 2 ? (
        <div className="grid items-start gap-3 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((metier) => {
            const score = profile ? scorer(metier, quiz.answers, quiz.interets) : undefined
            const fields = [
              score ? { label: "Compatibilité", value: `${score.pct} %` } : null,
              { label: "Niveau d'études", value: NIVEAUX[metier.niveau] ?? "—" },
              { label: "Statuts", value: labelsFromMask(metier.statuts, STATUTS).join(", ") || "—" },
              { label: "Salaire débutant (indicatif)", value: metier.salaire ? formatSalaire(metier.salaire) : "Non indiqué" },
              { label: "Secteurs", value: labelsFromMask(metier.secteurs, SECTEURS).join(", ") || "—" },
              ...ficheCrit(unpackCrit(metier.crit)),
              ...grilleRows(metier),
              ...marcheRows(metier).filter((row) => !row.label.startsWith("Fiche ROME")),
            ].filter((field): field is { label: string; value: string } => field !== null)
            return (
              <article key={metier.id} className="rounded-3xl border border-line bg-card p-4">
                <h2 className="font-display text-2xl leading-tight font-semibold">
                  <Link className="hover:underline" to={`/metier/${metier.id}`}>
                    {metier.nom}
                  </Link>
                </h2>
                <dl className="mt-3 grid gap-3">
                  {fields.map((field) => (
                    <div key={field.label}>
                      <dt className="text-sm font-semibold text-muted">{field.label}</dt>
                      <dd>{field.value}</dd>
                    </div>
                  ))}
                </dl>
                <Button className="mt-4" variant="ghost" size="sm" onClick={() => library.toggleCompare(metier.id)}>
                  Retirer
                </Button>
              </article>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
