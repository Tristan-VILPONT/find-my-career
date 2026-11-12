import { useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { DATASET } from "../generated/dataset.ts"
import { formatNombre } from "../lib/format.ts"
import { hasBit, hasProfile, norm, rankMetiers } from "../lib/scoring.ts"
import type { RankedMetier } from "../lib/types.ts"
import { INTERETS, NIVEAUX, PAGE_SIZE, SECTEURS } from "../lib/vocab.ts"
import { FILTRES_GRILLE } from "../lib/grille.ts"
import { useCatalog } from "../state/CatalogProvider.tsx"
import { useQuiz } from "../state/QuizProvider.tsx"
import { MetierCard } from "../components/MetierCard.tsx"
import { Button } from "../components/ui/button.tsx"

export function ExplorerPage() {
  const catalog = useCatalog()
  const quiz = useQuiz()
  const [params, setParams] = useSearchParams()
  const [shown, setShown] = useState(PAGE_SIZE)
  const query = params.get("q") ?? ""
  const secteur = params.get("secteur") ?? "all"
  const niveau = params.get("niveau") ?? "all"
  const interet = params.get("interet") ?? "all"
  const grille = params.get("grille") ?? "all"
  const tri = params.get("tri") === "compat" ? "compat" : "alpha"
  const profile = hasProfile(quiz.answers, quiz.interets)

  function update(next: Record<string, string>) {
    const merged = new URLSearchParams(params)
    for (const [key, value] of Object.entries(next)) {
      if (!value || value === "all" || (key === "tri" && value === "alpha")) merged.delete(key)
      else merged.set(key, value)
    }
    setParams(merged)
    setShown(PAGE_SIZE)
  }

  const list = useMemo(() => {
    let rows: RankedMetier[]
    if (tri === "compat" && profile && catalog.status === "ready") {
      rows = rankMetiers(catalog.metiers, quiz.answers, quiz.interets)
    } else {
      rows = [...catalog.metiers]
        .sort((a, b) => a.nom.localeCompare(b.nom, "fr"))
        .map((metier) => ({ ...metier, pct: 0, raisons: [], communs: [] }))
    }
    const folded = norm(query.trim())
    const secteurIndex = secteur === "all" ? -1 : Number(secteur)
    const niveauIndex = niveau === "all" ? -1 : Number(niveau)
    const interetIndex = interet === "all" ? -1 : Number(interet)
    const filtre = FILTRES_GRILLE.find((item) => item.value === grille)
    return rows.filter((metier) => {
      if (secteurIndex >= 0 && !hasBit(metier.secteurs, secteurIndex)) return false
      if (niveauIndex >= 0 && metier.niveau !== niveauIndex) return false
      if (interetIndex >= 0 && !hasBit(metier.interets, interetIndex)) return false
      if (filtre && !filtre.test(metier.g)) return false
      if (!folded) return true
      return norm(`${metier.nom} ${metier.accroche} ${metier.mots}`).includes(folded)
    })
  }, [catalog.metiers, catalog.status, tri, profile, quiz.answers, quiz.interets, query, secteur, niveau, interet, grille])

  const visible = list.slice(0, shown)

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="font-display text-4xl font-semibold text-balance">Explorer tous les métiers</h1>
        <p className="mt-2 max-w-2xl text-muted">
          {formatNombre(DATASET.count)} fiches Onisep. Cherche un nom, ou filtre par secteur, niveau d'études, centre d'intérêt, ou selon ta grille (parcours, temps libre, santé, recrutement).
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="grid gap-1 text-sm font-semibold md:col-span-2" htmlFor="explorer-q">
          Recherche
          <input
            id="explorer-q"
            value={query}
            placeholder="Infirmier, jeu vidéo, animaux…"
            className="min-h-12 rounded-2xl border border-line bg-card px-3 text-base font-normal"
            onChange={(event) => update({ q: event.target.value })}
          />
        </label>
        <FilterSelect id="explorer-secteur" label="Secteur" value={secteur} onChange={(value) => update({ secteur: value })} options={SECTEURS} />
        <FilterSelect id="explorer-niveau" label="Niveau d'études" value={niveau} onChange={(value) => update({ niveau: value })} options={NIVEAUX} />
        <FilterSelect id="explorer-interet" label="Centre d'intérêt" value={interet} onChange={(value) => update({ interet: value })} options={INTERETS} />
        <label className="grid gap-1 text-sm font-semibold" htmlFor="explorer-grille">
          Ta grille et le marché du travail
          <select
            id="explorer-grille"
            value={grille}
            className="min-h-12 rounded-2xl border border-line bg-card px-3 text-base font-normal"
            onChange={(event) => update({ grille: event.target.value })}
          >
            <option value="all">Tous</option>
            {FILTRES_GRILLE.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {profile ? (
          <Button variant={tri === "compat" ? "default" : "outline"} size="sm" aria-pressed={tri === "compat"} onClick={() => update({ tri: tri === "compat" ? "alpha" : "compat" })}>
            {tri === "compat" ? "Tri : compatibilité" : "Trier selon mon quiz"}
          </Button>
        ) : null}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setParams(new URLSearchParams())
            setShown(PAGE_SIZE)
          }}
        >
          Effacer les filtres
        </Button>
        <p className="text-sm text-muted" role="status">
          {catalog.status === "ready" ? `${formatNombre(list.length)} métier${list.length > 1 ? "s" : ""}` : "Chargement…"}
        </p>
      </div>
      {catalog.status === "error" ? (
        <div role="alert" className="rounded-3xl border border-line bg-card p-4">
          <p>{catalog.error}</p>
          <Button className="mt-3" onClick={catalog.reload}>
            Réessayer
          </Button>
        </div>
      ) : null}
      {catalog.status === "ready" && list.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-line p-4">Aucun métier avec ces filtres. Essaie un autre mot, ou enlève un filtre.</p>
      ) : null}
      <div className="grid gap-3">
        {visible.map((metier, index) => (
          <MetierCard key={metier.id} metier={metier} rank={tri === "compat" ? index + 1 : undefined} showScore={tri === "compat"} />
        ))}
      </div>
      {shown < list.length ? (
        <Button variant="outline" onClick={() => setShown((count) => count + PAGE_SIZE)}>
          Voir plus ({formatNombre(Math.min(PAGE_SIZE, list.length - shown))} de plus)
        </Button>
      ) : null}
    </div>
  )
}

function FilterSelect({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  options: string[]
}) {
  return (
    <label className="grid gap-1 text-sm font-semibold" htmlFor={id}>
      {label}
      <select id={id} value={value} className="min-h-12 rounded-2xl border border-line bg-card px-3 text-base font-normal" onChange={(event) => onChange(event.target.value)}>
        <option value="all">Tous</option>
        {options.map((option, index) => (
          <option key={option} value={String(index)}>
            {option}
          </option>
        ))}
      </select>
    </label>
  )
}
