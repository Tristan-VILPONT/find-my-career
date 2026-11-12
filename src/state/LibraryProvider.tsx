import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"

const FAVORITES_KEY = "quel-metier.favoris.v1"
const COMPARE_KEY = "quel-metier.comparer.v1"

type LibraryValue = {
  favorites: string[]
  compare: string[]
  message: string
  isFavorite: (id: string) => boolean
  isCompared: (id: string) => boolean
  toggleFavorite: (id: string) => void
  toggleCompare: (id: string) => void
  clearCompare: () => void
}

const LibraryContext = createContext<LibraryValue | null>(null)

function readIds(key: string): string[] {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item): item is string => typeof item === "string").slice(0, 80)
  } catch {
    return []
  }
}

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>(() => readIds(FAVORITES_KEY))
  const [compare, setCompare] = useState<string[]>(() => readIds(COMPARE_KEY).slice(0, 3))
  const [message, setMessage] = useState("")

  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites))
  }, [favorites])

  useEffect(() => {
    localStorage.setItem(COMPARE_KEY, JSON.stringify(compare))
  }, [compare])

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))
  }, [])

  const toggleCompare = useCallback((id: string) => {
    setCompare((current) => {
      if (current.includes(id)) {
        setMessage("")
        return current.filter((item) => item !== id)
      }
      if (current.length >= 3) {
        setMessage("Tu peux comparer 3 métiers au maximum. Retires-en un pour en ajouter un autre.")
        return current
      }
      setMessage("")
      return [...current, id]
    })
  }, [])

  const clearCompare = useCallback(() => {
    setCompare([])
    setMessage("")
  }, [])

  const value = useMemo<LibraryValue>(
    () => ({
      favorites,
      compare,
      message,
      isFavorite: (id) => favorites.includes(id),
      isCompared: (id) => compare.includes(id),
      toggleFavorite,
      toggleCompare,
      clearCompare,
    }),
    [favorites, compare, message, toggleFavorite, toggleCompare, clearCompare],
  )

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>
}

export function useLibrary(): LibraryValue {
  const value = useContext(LibraryContext)
  if (!value) throw new Error("useLibrary doit être utilisé dans LibraryProvider")
  return value
}
