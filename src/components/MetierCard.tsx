import { Heart } from "lucide-react"
import { useState } from "react"
import { Link } from "react-router-dom"
import { formatNombre } from "../lib/format.ts"
import type { RankedMetier } from "../lib/types.ts"
import { useLibrary } from "../state/LibraryProvider.tsx"
import { Button } from "./ui/button.tsx"
import { FicheBody } from "./FicheBody.tsx"

export function MetierCard({
  metier,
  rank,
  best,
  expandable,
  showScore = true,
}: {
  metier: RankedMetier
  rank?: number
  best?: boolean
  expandable?: boolean
  showScore?: boolean
}) {
  const [open, setOpen] = useState(false)
  const library = useLibrary()
  const favorite = library.isFavorite(metier.id)
  const compared = library.isCompared(metier.id)
  const tone = metier.pct >= 70 ? "text-good" : metier.pct >= 55 ? "text-accent" : "text-muted"

  return (
    <article className="rounded-3xl border border-line bg-card p-4 shadow-[0_1px_0_rgba(28,23,20,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {rank !== undefined ? (
            <p className="mb-1 text-sm text-muted">{best ? "Meilleure correspondance" : `n°${formatNombre(rank)}`}</p>
          ) : null}
          <h2 className="font-display text-2xl leading-tight font-semibold text-balance">
            <Link className="rounded-md hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" to={`/metier/${metier.id}`}>
              {metier.nom}
            </Link>
          </h2>
        </div>
        {showScore ? (
          <p className={`shrink-0 text-2xl font-semibold tabular-nums ${tone}`}>
            <span className="sr-only">Compatibilité </span>
            {metier.pct}&nbsp;%
          </p>
        ) : null}
      </div>
      {showScore ? (
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-line" aria-hidden="true">
          <div className="h-full rounded-full bg-accent" style={{ width: `${metier.pct}%` }} />
        </div>
      ) : null}
      {metier.accroche ? <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted">{metier.accroche}</p> : null}
      {showScore && metier.raisons.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-2">
          {metier.raisons.map((raison) => (
            <li key={raison} className="rounded-full bg-accent-soft px-3 py-1 text-sm font-medium text-accent-strong">
              {raison}
            </li>
          ))}
        </ul>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        {expandable ? (
          <Button variant={best && !open ? "default" : "outline"} onClick={() => setOpen((value) => !value)} aria-expanded={open}>
            {open ? "Fermer" : "Voir plus"}
          </Button>
        ) : (
          <Button asChild variant="outline">
            <Link to={`/metier/${metier.id}`}>Voir la fiche</Link>
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          aria-pressed={favorite}
          onClick={() => library.toggleFavorite(metier.id)}
        >
          <Heart aria-hidden="true" className={favorite ? "fill-accent text-accent" : ""} size={18} />
          {favorite ? "Dans tes favoris" : "Favori"}
        </Button>
        <Button variant={compared ? "default" : "ghost"} size="sm" aria-pressed={compared} onClick={() => library.toggleCompare(metier.id)}>
          {compared ? "Ajouté à la comparaison" : "Comparer"}
        </Button>
      </div>
      {open ? (
        <div className="mt-4 border-t border-line pt-4">
          <FicheBody metier={metier} score={metier} />
        </div>
      ) : null}
    </article>
  )
}
