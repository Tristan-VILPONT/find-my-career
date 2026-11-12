import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { loadCatalog } from "../lib/catalog.ts"
import type { Metier } from "../lib/types.ts"

type Status = "loading" | "ready" | "error"

type CatalogValue = {
  status: Status
  metiers: Metier[]
  error: string
  reload: () => void
}

const CatalogContext = createContext<CatalogValue | null>(null)

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>("loading")
  const [metiers, setMetiers] = useState<Metier[]>([])
  const [error, setError] = useState("")
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    loadCatalog()
      .then((data) => {
        if (cancelled) return
        setMetiers(data.metiers)
        setStatus("ready")
      })
      .catch((reason: unknown) => {
        if (cancelled) return
        setStatus("error")
        setError(reason instanceof Error ? reason.message : "Le catalogue n'a pas pu être chargé.")
      })
    return () => {
      cancelled = true
    }
  }, [attempt])

  const reload = useCallback(() => {
    setStatus("loading")
    setError("")
    setAttempt((value) => value + 1)
  }, [])
  const value = useMemo(() => ({ status, metiers, error, reload }), [status, metiers, error, reload])

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
}

export function useCatalog(): CatalogValue {
  const value = useContext(CatalogContext)
  if (!value) throw new Error("useCatalog doit être utilisé dans CatalogProvider")
  return value
}
