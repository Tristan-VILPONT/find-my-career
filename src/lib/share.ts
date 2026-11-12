import { SITE } from "./site.ts"

const MARK_DOTS = ["#1f7a4d", "#1d4ed8", "#be123c", "#6d28d9", "#92400e", "#0f766e", "#4338ca"]

const MARK_HOOK = new Path2D(
  "M33 12.5c-7.2 0-12.2 4.4-12.4 10.1h6.2c.3-2.4 2.5-4.1 6.1-4.1 3.2 0 5.4 1.7 5.4 4.2 0 2.4-1.6 3.7-4.6 5.2l-1.5.8c-4 2-6.2 4.4-6.2 8.2v1.3h6.2v-1.1c0-2.1 1.1-3.4 4.7-5.2 4.1-2 7.2-4.6 7.2-9.3 0-5.8-4.7-10.1-11.1-10.1z",
)

function drawMark(ctx: CanvasRenderingContext2D, ox: number, oy: number, scale: number) {
  ctx.save()
  ctx.translate(ox, oy)
  ctx.scale(scale, scale)
  ctx.fillStyle = "#9a3412"
  ctx.beginPath()
  ctx.roundRect(0, 0, 64, 64, 16)
  ctx.fill()
  ctx.fillStyle = "#f6f1e8"
  ctx.fill(MARK_HOOK)
  ctx.beginPath()
  ctx.arc(32.2, 46.6, 3.15, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.roundRect(7, 52.5, 50, 7.2, 3.6)
  ctx.fill()
  MARK_DOTS.forEach((color, index) => {
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(12.2 + index * 6.4, 56.1, 2.15, 0, Math.PI * 2)
    ctx.fill()
  })
  ctx.restore()
}

export type ShareCardInput = {
  families: string[]
  top: { nom: string; pct: number }[]
  bons: number
  total: number
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ")
  const lines: string[] = []
  let current = ""
  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (ctx.measureText(next).width > maxWidth && current) {
      lines.push(current)
      current = word
    } else {
      current = next
    }
  }
  if (current) lines.push(current)
  return lines.slice(0, 2)
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  ctx.beginPath()
  ctx.roundRect(x, y, width, height, radius)
}

export async function renderProfilCard(input: ShareCardInput): Promise<Blob> {
  await document.fonts.load("700 72px 'Fraunces Variable'")
  await document.fonts.load("600 32px 'Outfit Variable'")
  await document.fonts.ready

  const canvas = document.createElement("canvas")
  canvas.width = 1080
  canvas.height = 1350
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Canvas indisponible")

  ctx.fillStyle = "#f6f1e8"
  ctx.fillRect(0, 0, 1080, 1350)

  ctx.fillStyle = "#9a3412"
  ctx.fillRect(0, 0, 1080, 320)
  drawMark(ctx, 72, 48, 1.15)
  ctx.fillStyle = "#f6f1e8"
  ctx.font = "700 42px 'Fraunces Variable', Georgia, serif"
  ctx.fillText(SITE.name, 168, 100)
  ctx.font = "600 28px 'Outfit Variable', sans-serif"
  ctx.fillText(SITE.tagline, 168, 148)
  ctx.font = "700 64px 'Fraunces Variable', Georgia, serif"
  ctx.fillText("Mon profil métier", 72, 270)

  ctx.fillStyle = "#1c1714"
  ctx.font = "600 28px 'Outfit Variable', sans-serif"
  ctx.fillText("Ce qui te ressemble", 72, 380)

  ctx.font = "600 30px 'Outfit Variable', sans-serif"
  let x = 72
  let y = 420
  const families = input.families.length > 0 ? input.families : ["Toutes les pistes restent ouvertes"]
  for (const family of families) {
    const width = Math.min(ctx.measureText(family).width + 48, 920)
    if (x + width > 1008) {
      x = 72
      y += 68
    }
    roundRect(ctx, x, y, width, 52, 26)
    ctx.fillStyle = "#fffdf9"
    ctx.fill()
    ctx.strokeStyle = "#e3d8cb"
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.fillStyle = "#1c1714"
    ctx.fillText(family, x + 24, y + 35)
    x += width + 12
  }

  y += 110
  ctx.font = "600 28px 'Outfit Variable', sans-serif"
  ctx.fillStyle = "#1c1714"
  ctx.fillText("Tes meilleures pistes", 72, y)
  y += 28

  input.top.slice(0, 3).forEach((metier, index) => {
    y += 24
    roundRect(ctx, 72, y, 936, 150, 28)
    ctx.fillStyle = "#fffdf9"
    ctx.fill()
    ctx.fillStyle = "#9a3412"
    ctx.font = "700 28px 'Outfit Variable', sans-serif"
    ctx.fillText(String(index + 1), 100, y + 64)
    ctx.fillStyle = "#1c1714"
    ctx.font = "700 34px 'Fraunces Variable', Georgia, serif"
    const lines = wrap(ctx, metier.nom, 620)
    lines.forEach((line, lineIndex) => {
      ctx.fillText(line, 150, y + 58 + lineIndex * 42)
    })
    ctx.textAlign = "right"
    ctx.fillStyle = metier.pct >= 70 ? "#166534" : "#9a3412"
    ctx.font = "700 48px 'Outfit Variable', sans-serif"
    ctx.fillText(`${metier.pct} %`, 972, y + 88)
    ctx.textAlign = "left"
    y += 150
  })

  if (input.top.length === 0) {
    ctx.font = "500 32px 'Outfit Variable', sans-serif"
    ctx.fillStyle = "#4e463f"
    ctx.fillText("Pas encore de piste à montrer.", 72, y + 48)
  }

  ctx.fillStyle = "#4e463f"
  ctx.font = "500 26px 'Outfit Variable', sans-serif"
  const line = `${input.bons} métier${input.bons > 1 ? "s" : ""} à 70 % ou plus, sur ${input.total}`
  ctx.fillText(line, 72, 1228)
  ctx.fillText("Données Onisep · rien de personnel sur cette image", 72, 1270)
  ctx.fillText(SITE.domain, 72, 1312)

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"))
  if (!blob) throw new Error("Impossible de créer l'image")
  return blob
}
