import { useState, type ReactNode } from "react"
import { Check } from "lucide-react"
import { DATASET } from "../generated/dataset.ts"
import { SITE } from "../lib/site.ts"
import { LogoMark } from "../components/LogoMark.tsx"
import { formatNombre } from "../lib/format.ts"
import { FAMILIES, INTERETS, QUESTIONS, TOTAL_ETAPES } from "../lib/vocab.ts"
import { useQuiz } from "../state/QuizProvider.tsx"
import { FamilyIcon } from "../components/FamilyIcon.tsx"
import { ProgressBar } from "../components/ProgressBar.tsx"
import { Button } from "../components/ui/button.tsx"

function ResetConfirm({ onCancel }: { onCancel: () => void }) {
  const quiz = useQuiz()
  return (
    <div role="alertdialog" aria-labelledby="reset-title" className="rounded-3xl border border-line bg-accent-soft p-4">
      <p id="reset-title" className="font-semibold">
        Effacer tes réponses et revenir au début ?
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          onClick={() => {
            quiz.reset()
            onCancel()
          }}
        >
          Oui, recommencer
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Annuler
        </Button>
      </div>
    </div>
  )
}

export function QuizChrome({
  current,
  caption,
  children,
}: {
  current: number
  caption?: string
  children: ReactNode
}) {
  const quiz = useQuiz()
  const [confirm, setConfirm] = useState(false)
  return (
    <div className="mx-auto grid w-full max-w-xl gap-4">
      <ProgressBar current={current} total={TOTAL_ETAPES} caption={caption} />
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={quiz.retour}>
          Retour
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setConfirm(true)}>
          Recommencer
        </Button>
      </div>
      {confirm ? <ResetConfirm onCancel={() => setConfirm(false)} /> : null}
      {children}
    </div>
  )
}

export function IntroScreen() {
  const quiz = useQuiz()
  const count = formatNombre(DATASET.count)
  return (
    <div data-testid="intro" className="mx-auto grid w-full max-w-3xl gap-6">
      <div className="hero-wash rounded-[2rem] px-1 py-2 md:px-4">
        <LogoMark size={72} />
        <h1 className="mt-4 font-display text-4xl leading-tight font-semibold text-balance md:text-5xl">{SITE.name}</h1>
        <p className="mt-2 text-lg font-medium text-accent">{SITE.tagline}</p>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed">
          Tu n'as pas à savoir déjà ce que tu veux faire. À 15 ans, c'est normal. Ce quiz te demande ce qui t'attire et ce qui compte pour toi, puis il te propose des pistes parmi les {count} métiers référencés par l'Onisep.
        </p>
      </div>
      <ol className="grid gap-3 md:grid-cols-3">
        {[
          ["Dis ce qui te ressemble", "D'abord quelques grandes familles, puis autant de centres d'intérêt officiels de l'Onisep que tu veux."],
          ["Réponds à 12 questions", "Les études, le lieu de travail, la santé, l'utilité, le temps libre, ton parcours (salarié, à ton compte, ta propre entreprise)… À chaque fois, tu peux dire « peu importe »."],
          ["Explore tes métiers", "Un classement, des fiches, et un lien vers l'Onisep pour aller plus loin."],
        ].map(([title, detail], index) => (
          <li key={title} className="rounded-3xl border border-line bg-card p-4">
            <p className="font-display text-3xl font-semibold text-accent">{index + 1}</p>
            <h2 className="mt-1 font-semibold">{title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{detail}</p>
          </li>
        ))}
      </ol>
      <aside className="rounded-3xl border border-line bg-card p-4">
        <h2 className="font-semibold">À propos des estimations</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Certains critères (lieu, télétravail, horaires, utilité, stabilité, région, parcours, investissement, temps libre, santé) sont déduits des textes Onisep et des conditions de travail du ROME de France Travail, pas toujours écrits noir sur blanc. Dans les fiches, une estimation est signalée et compte deux fois moins dans le score. Elle peut être inexacte : la page Onisep reste la référence. Tes réponses restent dans ton navigateur, pour reprendre plus tard ou garder tes favoris. Rien n'est envoyé.
        </p>
      </aside>
      <div>
        <Button className="w-full md:w-auto" onClick={quiz.start}>
          Commencer le quiz
        </Button>
      </div>
    </div>
  )
}

export function FamillesScreen() {
  const quiz = useQuiz()
  return (
    <QuizChrome
      current={1}
      caption={`Étape 1 sur ${TOTAL_ETAPES} · Ce qui te ressemble · Les familles`}
    >
      <section className="rounded-3xl border border-line bg-card p-4 md:p-5">
        <h1 className="font-display text-3xl font-semibold">Ce qui te ressemble</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          D'abord, choisis les grandes familles qui te parlent. Ensuite tu préciseras avec les centres d'intérêt officiels de l'Onisep. Autant que tu veux, sans maximum. Ces familles sont juste là pour t'y retrouver : ce n'est pas une classification officielle.
        </p>
        <div className="mt-4 grid gap-2">
          {FAMILIES.map((family, index) => {
            const selected = quiz.familles.includes(index)
            return (
              <button
                key={family.titre}
                type="button"
                aria-pressed={selected}
                onClick={() => quiz.toggleFamille(index)}
                className="flex min-h-16 items-center gap-3 rounded-2xl border px-3 py-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                style={{
                  borderColor: selected ? family.color : "#e3d8cb",
                  background: selected ? family.soft : "#fffdf9",
                }}
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl" style={{ background: "#fffdf9", color: family.color }}>
                  <FamilyIcon name={family.icon} />
                </span>
                <span className="flex-1 font-semibold">{family.titre}</span>
                {selected ? <Check aria-hidden="true" style={{ color: family.color }} /> : null}
              </button>
            )
          })}
        </div>
        <p id="familles-help" className="mt-4 text-sm text-muted">
          {quiz.familles.length === 0
            ? "Choisis au moins une famille pour continuer."
            : `${quiz.familles.length} famille${quiz.familles.length > 1 ? "s" : ""} sélectionnée${quiz.familles.length > 1 ? "s" : ""}.`}
        </p>
        <Button className="mt-3 w-full md:w-auto" disabled={quiz.familles.length === 0} aria-describedby="familles-help" onClick={quiz.continuerFamilles}>
          Continuer
        </Button>
      </section>
    </QuizChrome>
  )
}

export function EnviesScreen() {
  const quiz = useQuiz()
  const chosen = FAMILIES.filter((_, index) => quiz.familles.includes(index))
  return (
    <QuizChrome current={1} caption={`Étape 1 sur ${TOTAL_ETAPES} · Ce qui te ressemble · Tes envies`}>
      <section className="rounded-3xl border border-line bg-card p-4 md:p-5">
        <h1 className="font-display text-3xl font-semibold">Ce qui te ressemble</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Parmi les familles que tu as choisies, coche toutes les envies qui te ressemblent. Ce sont les centres d'intérêt officiels de l'Onisep. Au moins une, pas de maximum.
        </p>
        <div className="mt-4 grid gap-5">
          {chosen.map((family) => {
            const allOn = family.ids.every((id) => quiz.interets.includes(id))
            return (
              <fieldset key={family.titre} className="min-w-0 border-0 p-0">
                <legend className="mb-2 text-sm font-semibold" style={{ color: family.color }}>
                  {family.titre}
                </legend>
                <div className="mb-2 flex justify-end">
                  <Button variant={allOn ? "default" : "outline"} size="sm" aria-pressed={allOn} onClick={() => quiz.toggleTous(family.ids)} style={allOn ? { background: family.color } : undefined}>
                    {allOn ? "Tout désélectionner" : "Tout sélectionner"}
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {family.ids.map((id) => {
                    const selected = quiz.interets.includes(id)
                    return (
                      <button
                        key={id}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => quiz.toggleInteret(id)}
                        className="max-w-full rounded-full px-3 py-2 text-left text-sm leading-snug focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                        style={
                          selected
                            ? { background: family.color, color: "#fffdf9" }
                            : { background: "#fffdf9", color: "#1c1714", border: "1px solid #e3d8cb" }
                        }
                      >
                        {INTERETS[id]}
                      </button>
                    )
                  })}
                </div>
              </fieldset>
            )
          })}
        </div>
        <p id="envies-help" className="mt-4 text-sm text-muted">
          {quiz.interets.length === 0
            ? "Choisis au moins une envie pour continuer."
            : `${quiz.interets.length} envie${quiz.interets.length > 1 ? "s" : ""} sélectionnée${quiz.interets.length > 1 ? "s" : ""}, pas de maximum.`}
        </p>
        <Button className="mt-3 w-full md:w-auto" disabled={quiz.interets.length === 0} aria-describedby="envies-help" onClick={quiz.continuerEnvies}>
          Continuer
        </Button>
      </section>
    </QuizChrome>
  )
}

export function QuestionScreen() {
  const quiz = useQuiz()
  const question = QUESTIONS[quiz.index]
  if (!question) return null
  return (
    <QuizChrome current={quiz.index + 2}>
      <section data-testid="question" className="rounded-3xl border border-line bg-card p-4 md:p-5">
        <h1 className="font-display text-3xl leading-tight font-semibold text-balance">{question.titre}</h1>
        {question.precis ? <p className="mt-3 text-sm leading-relaxed text-muted">{question.precis}</p> : null}
        <div className="mt-4 grid gap-2" role="group" aria-label={question.titre}>
          {question.choices.map((choice) => {
            const selected = quiz.answers[question.id] === choice.value
            return (
              <Button
                key={choice.value}
                variant={selected ? "default" : "outline"}
                aria-pressed={selected}
                className="h-auto w-full justify-start rounded-2xl px-4 py-3 text-left font-medium whitespace-normal"
                onClick={() => quiz.choisir(choice.value)}
              >
                {choice.label}
              </Button>
            )
          })}
        </div>
      </section>
    </QuizChrome>
  )
}
