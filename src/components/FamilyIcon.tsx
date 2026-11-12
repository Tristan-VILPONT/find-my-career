import { ClipboardList, Cpu, Hammer, HeartPulse, Leaf, MessagesSquare, Palette } from "lucide-react"
import type { FamilyIconName } from "../lib/vocab.ts"

const ICONS = {
  leaf: Leaf,
  cpu: Cpu,
  heart: HeartPulse,
  palette: Palette,
  hammer: Hammer,
  clipboard: ClipboardList,
  messages: MessagesSquare,
} as const

export function FamilyIcon({ name }: { name: FamilyIconName }) {
  const Icon = ICONS[name]
  return <Icon aria-hidden="true" size={22} strokeWidth={1.75} />
}
