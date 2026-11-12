import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import type { ButtonHTMLAttributes } from "react"
import { cn } from "../../lib/cn.ts"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-accent text-white hover:bg-accent-strong",
        outline: "border border-line bg-card text-ink hover:bg-accent-soft",
        ghost: "bg-transparent text-ink hover:bg-black/5",
      },
      size: {
        default: "min-h-12 px-5 text-base",
        sm: "min-h-11 px-3 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }

export function Button({ className, variant, size, asChild = false, type, ...props }: ButtonProps) {
  if (asChild) {
    return <Slot className={cn(buttonVariants({ variant, size }), className)} {...props} />
  }
  return (
    <button type={type ?? "button"} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  )
}
