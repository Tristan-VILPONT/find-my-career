import type { ScoreDetail } from "../lib/types.ts"
import type { Metier } from "../lib/types.ts"
import { ficheCrit, indicesFromMask, labelsFromMask, unpackCrit } from "../lib/scoring.ts"
import { formatSalaire } from "../lib/format.ts"
import { grilleRows, marcheRows, metierscope, sourcesPhrase } from "../lib/grille.ts"
import { ficheOnisep, INTERETS, NIVEAUX, SECTEURS, STATUTS } from "../lib/vocab.ts"

export function FicheBody({ metier, score }: { metier: Metier; score?: ScoreDetail }) {
  const statuts = labelsFromMask(metier.statuts, STATUTS)
  const secteurs = labelsFromMask(metier.secteurs, SECTEURS)
  const criteres = ficheCrit(unpackCrit(metier.crit))
  const interets = indicesFromMask(metier.interets, INTERETS.length)
  const grille = grilleRows(metier)
  const marche = marcheRows(metier)
  const hasEstimate = [...criteres, ...grille].some((item) => item.value.includes("(estimation)"))

  const rows = [
    { label: "Niveau d'études", value: NIVEAUX[metier.niveau] ?? "" },
    statuts.length > 0 ? { label: "Statuts", value: statuts.join(", ") } : null,
    metier.salaire > 0 ? { label: "Salaire débutant (indicatif)", value: formatSalaire(metier.salaire) } : null,
    { label: "Secteurs", value: secteurs.join(", ") || "—" },
    ...criteres,
  ].filter((row): row is { label: string; value: string } => row !== null && row.value !== "")

  return (
    <div data-testid="fiche" className="grid gap-4">
      {metier.accroche ? <p className="text-base leading-relaxed">{metier.accroche}</p> : null}
      <dl className="grid gap-3">
        {rows.map((row) => (
          <div key={row.label} className="grid gap-0.5 border-t border-line pt-3">
            <dt className="text-sm font-semibold text-muted">{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
      {grille.length > 0 ? (
        <section className="grid gap-3 rounded-3xl border border-line bg-paper p-4" aria-labelledby={`grille-${metier.id}`}>
          <h3 id={`grille-${metier.id}`} className="font-display text-xl font-semibold">Les critères de ta grille</h3>
          <dl className="grid gap-3">
            {grille.map((row) => (
              <div key={row.label} className="grid gap-0.5">
                <dt className="text-sm font-semibold text-muted">{row.label}</dt>
                <dd>{row.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}
      {marche.length > 0 ? (
        <section className="grid gap-3 rounded-3xl border border-line bg-paper p-4" aria-labelledby={`marche-${metier.id}`}>
          <h3 id={`marche-${metier.id}`} className="font-display text-xl font-semibold">Le marché du travail</h3>
          <dl className="grid gap-3">
            {marche.map((row) => (
              <div key={row.label} className="grid gap-0.5">
                <dt className="text-sm font-semibold text-muted">{row.label}</dt>
                <dd>{row.value}</dd>
              </div>
            ))}
          </dl>
          {metier.g?.r && metier.g.r.length > 0 ? (
            <p className="text-sm">
              {metier.g.r.map((code, index) => (
                <a key={code} className="mr-3 font-semibold text-accent underline-offset-4 hover:underline" href={metierscope(code)} target="_blank" rel="noreferrer">
                  {index === 0 ? "Voir la fiche ROME " : ""}
                  {code} sur France Travail
                </a>
              ))}
            </p>
          ) : null}
          <p className="text-sm leading-relaxed text-muted">{sourcesPhrase(metier)}</p>
        </section>
      ) : null}
      <div>
        <h3 className="mb-2 text-sm font-semibold text-muted">Centres d'intérêt Onisep</h3>
        {interets.length === 0 ? (
          <p className="text-sm text-muted">Aucun centre d'intérêt indiqué sur la fiche.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {interets.map((index) => {
              const match = score?.communs.includes(index) ?? false
              return (
                <li
                  key={index}
                  className={
                    match
                      ? "rounded-full bg-accent-soft px-3 py-1 text-sm font-semibold text-accent-strong"
                      : "rounded-full bg-paper px-3 py-1 text-sm"
                  }
                >
                  {INTERETS[index]}
                  {match ? " (parmi tes envies)" : ""}
                </li>
              )
            })}
          </ul>
        )}
      </div>
      {hasEstimate ? (
        <p className="text-sm leading-relaxed text-muted">
          « (estimation) » veut dire que ce critère est déduit des textes Onisep ou du ROME, pas écrit noir sur blanc. Il compte deux fois moins dans le score.
        </p>
      ) : null}
      <a
        className="inline-flex min-h-12 items-center justify-center rounded-full bg-ink px-5 font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        href={ficheOnisep(metier.id)}
        target="_blank"
        rel="noreferrer"
      >
        Lire la fiche sur onisep.fr
      </a>
    </div>
  )
}
