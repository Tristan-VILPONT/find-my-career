import { SEUIL_BIEN } from "./vocab.ts"

export function formatNombre(value: number): string {
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, "\u202F")
}

export function formatSalaire(euros: number): string {
  return `environ ${formatNombre(euros)}\u202F€ brut / mois`
}

export function bannerCorrespondance(bons: number, total: number): string {
  const corpus = formatNombre(total)
  const seuil = `70\u202F% ou plus, sur ${corpus}`
  if (bons <= 0) return `Aucun métier ne correspond bien à tes réponses (${seuil})`
  if (bons === 1) return `1 métier correspond bien à tes réponses (${seuil})`
  return `${formatNombre(bons)} métiers correspondent bien à tes réponses (${seuil})`
}

export function seuilBien(): number {
  return SEUIL_BIEN
}
