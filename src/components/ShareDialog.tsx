import { useEffect, useRef, useState } from "react"
import { renderProfilCard, type ShareCardInput } from "../lib/share.ts"
import { Button } from "./ui/button.tsx"

export function ShareDialog({
  open,
  onClose,
  card,
}: {
  open: boolean
  onClose: () => void
  card: ShareCardInput
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [url, setUrl] = useState<string | null>(null)
  const [blob, setBlob] = useState<Blob | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  const signature = `${card.bons}|${card.total}|${card.families.join("\u0001")}|${card.top.map((item) => `${item.pct}:${item.nom}`).join("\u0001")}`

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setError("")
    setBlob(null)
    renderProfilCard(card)
      .then((next) => {
        if (cancelled) return
        setBlob(next)
        setUrl((previous) => {
          if (previous) URL.revokeObjectURL(previous)
          return URL.createObjectURL(next)
        })
      })
      .catch(() => {
        if (!cancelled) setError("L'image n'a pas pu être créée.")
      })
    return () => {
      cancelled = true
    }
    // La signature résume la carte : on ne redessine pas à chaque rendu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, signature])

  useEffect(() => {
    return () => {
      if (url) URL.revokeObjectURL(url)
    }
  }, [url])

  function download() {
    if (!url) return
    const link = document.createElement("a")
    link.href = url
    link.download = "mon-profil-metier.png"
    link.click()
  }

  async function share() {
    if (!blob) return
    const file = new File([blob], "mon-profil-metier.png", { type: "image/png" })
    const nav = navigator
    if (nav.share) {
      const data: ShareData = { files: [file], title: "Mon profil métier", text: "Mes pistes de métiers." }
      try {
        if (!nav.canShare || nav.canShare(data)) {
          await nav.share(data)
          return
        }
      } catch (reason) {
        if (reason instanceof DOMException && reason.name === "AbortError") return
      }
    }
    download()
  }

  return (
    <dialog
      ref={dialogRef}
      className="w-[min(100%,28rem)] rounded-3xl border border-line bg-card p-4 text-ink"
      aria-labelledby="share-title"
      onClose={onClose}
    >
      <h2 id="share-title" className="font-display text-2xl font-semibold">
        Mon profil métier
      </h2>
      <p className="mt-1 text-sm text-muted">L'image ne contient que tes familles et tes meilleures pistes. Pas de nom, pas d'école.</p>
      {error ? <p className="mt-3 text-sm text-accent-strong">{error}</p> : null}
      {url ? (
        <img data-testid="share-preview" src={url} alt="Carte Mon profil métier, prête à être partagée" className="mt-3 max-h-[60vh] w-full rounded-2xl border border-line object-contain" />
      ) : (
        <p className="mt-3 text-sm text-muted" role="status">
          Préparation de l'image…
        </p>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button onClick={() => void share()} disabled={!blob}>
          Partager
        </Button>
        <Button variant="outline" onClick={download} disabled={!url}>
          Télécharger
        </Button>
        <Button variant="ghost" onClick={onClose}>
          Fermer
        </Button>
      </div>
    </dialog>
  )
}
