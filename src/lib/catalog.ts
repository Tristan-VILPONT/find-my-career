import type { CatalogFile, Metier } from "./types.ts"

let pending: Promise<CatalogFile> | null = null

export function loadCatalog(): Promise<CatalogFile> {
  if (!pending) {
    pending = fetch("/data/catalog.json")
      .then((response) => {
        if (!response.ok) throw new Error("Le catalogue n'a pas pu être chargé.")
        return response.json() as Promise<CatalogFile>
      })
      .then((data) => {
        if (!data || !Array.isArray(data.metiers) || data.metiers.length < 1000) {
          throw new Error("Le catalogue reçu est incomplet.")
        }
        return data
      })
      .catch((error: unknown) => {
        pending = null
        throw error
      })
  }
  return pending
}

export function findMetier(metiers: Metier[], id: string): Metier | undefined {
  return metiers.find((metier) => metier.id === id)
}
