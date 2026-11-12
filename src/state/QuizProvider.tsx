import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import type { Answers } from "../lib/types.ts"
import { FAMILIES, QUESTIONS } from "../lib/vocab.ts"

const STORAGE_KEY = "quel-metier.quiz.v1"

export type QuizScreen = "intro" | "familles" | "envies" | "quiz" | "results"

type QuizState = {
  screen: QuizScreen
  index: number
  answers: Answers
  interets: number[]
  familles: number[]
}

type QuizValue = QuizState & {
  start: () => void
  toggleFamille: (index: number) => void
  toggleInteret: (id: number) => void
  toggleTous: (ids: number[]) => void
  continuerFamilles: () => void
  continuerEnvies: () => void
  choisir: (value: string) => void
  retour: () => void
  reset: () => void
}

const QuizContext = createContext<QuizValue | null>(null)

const EMPTY: QuizState = {
  screen: "intro",
  index: 0,
  answers: {},
  interets: [],
  familles: [],
}

function sanitize(raw: unknown): QuizState {
  if (!raw || typeof raw !== "object") return EMPTY
  const value = raw as Partial<QuizState>
  const screen: QuizScreen =
    value.screen === "familles" || value.screen === "envies" || value.screen === "quiz" || value.screen === "results"
      ? value.screen
      : "intro"
  const familles = Array.isArray(value.familles)
    ? [...new Set(value.familles.filter((item) => Number.isInteger(item) && item >= 0 && item < FAMILIES.length))]
    : []
  const allowed = new Set(familles.flatMap((index) => FAMILIES[index].ids))
  const interets = Array.isArray(value.interets)
    ? [...new Set(value.interets.filter((item) => Number.isInteger(item) && allowed.has(item)))]
    : []
  const answers: Answers = {}
  if (value.answers && typeof value.answers === "object") {
    for (const question of QUESTIONS) {
      const choice = value.answers[question.id]
      if (typeof choice === "string" && question.choices.some((item) => item.value === choice)) {
        answers[question.id] = choice
      }
    }
  }
  const index = Number.isInteger(value.index) ? Math.max(0, Math.min(QUESTIONS.length - 1, value.index as number)) : 0
  return { screen, index, answers, interets, familles }
}

function readQuiz(): QuizState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return EMPTY
    return sanitize(JSON.parse(raw))
  } catch {
    return EMPTY
  }
}

export function QuizProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<QuizState>(readQuiz)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [state.screen, state.index])

  const start = useCallback(() => setState((current) => ({ ...current, screen: "familles" })), [])

  const toggleFamille = useCallback((index: number) => {
    setState((current) => {
      const familles = current.familles.includes(index)
        ? current.familles.filter((item) => item !== index)
        : [...current.familles, index]
      const allowed = new Set(familles.flatMap((item) => FAMILIES[item].ids))
      return { ...current, familles, interets: current.interets.filter((id) => allowed.has(id)) }
    })
  }, [])

  const toggleInteret = useCallback((id: number) => {
    setState((current) => ({
      ...current,
      interets: current.interets.includes(id) ? current.interets.filter((item) => item !== id) : [...current.interets, id],
    }))
  }, [])

  const toggleTous = useCallback((ids: number[]) => {
    setState((current) => {
      const allOn = ids.every((id) => current.interets.includes(id))
      if (allOn) return { ...current, interets: current.interets.filter((id) => !ids.includes(id)) }
      return { ...current, interets: [...new Set([...current.interets, ...ids])] }
    })
  }, [])

  const continuerFamilles = useCallback(() => {
    setState((current) => (current.familles.length === 0 ? current : { ...current, screen: "envies" }))
  }, [])

  const continuerEnvies = useCallback(() => {
    setState((current) => (current.interets.length === 0 ? current : { ...current, screen: "quiz", index: 0 }))
  }, [])

  const choisir = useCallback((value: string) => {
    setState((current) => {
      const question = QUESTIONS[current.index]
      if (!question || !question.choices.some((choice) => choice.value === value)) return current
      const answers = { ...current.answers, [question.id]: value }
      if (current.index < QUESTIONS.length - 1) return { ...current, answers, index: current.index + 1 }
      return { ...current, answers, screen: "results" }
    })
  }, [])

  const retour = useCallback(() => {
    setState((current) => {
      if (current.screen === "familles") return { ...current, screen: "intro" }
      if (current.screen === "envies") return { ...current, screen: "familles" }
      if (current.screen === "quiz") {
        if (current.index === 0) return { ...current, screen: "envies" }
        return { ...current, index: current.index - 1 }
      }
      if (current.screen === "results") return { ...current, screen: "quiz", index: QUESTIONS.length - 1 }
      return current
    })
  }, [])

  const reset = useCallback(() => setState(EMPTY), [])

  const value = useMemo<QuizValue>(
    () => ({
      ...state,
      start,
      toggleFamille,
      toggleInteret,
      toggleTous,
      continuerFamilles,
      continuerEnvies,
      choisir,
      retour,
      reset,
    }),
    [state, start, toggleFamille, toggleInteret, toggleTous, continuerFamilles, continuerEnvies, choisir, retour, reset],
  )

  return <QuizContext.Provider value={value}>{children}</QuizContext.Provider>
}

export function useQuiz(): QuizValue {
  const value = useContext(QuizContext)
  if (!value) throw new Error("useQuiz doit être utilisé dans QuizProvider")
  return value
}
