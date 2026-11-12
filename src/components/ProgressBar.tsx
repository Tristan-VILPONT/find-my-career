export function ProgressBar({
  current,
  total,
  caption,
}: {
  current: number
  total: number
  caption?: string
}) {
  const label = caption ?? `Étape ${current} sur ${total}`
  const pct = Math.max(0, Math.min(100, Math.round((current / total) * 100)))
  return (
    <div className="grid gap-2">
      <div className="flex items-baseline justify-between gap-3 text-sm text-muted">
        <span>{label}</span>
        <span>{pct} %</span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-line"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={current}
        aria-label={label}
      >
        <div className="h-full rounded-full bg-accent motion-safe:transition-[width]" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
