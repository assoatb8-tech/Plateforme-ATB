import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

export type BadgeTone = 'success' | 'warning' | 'error' | 'secondary' | 'neutral'

// Backgrounds stay the DESIGN.md-pinned brand tints (bg-*/10); text colors
// are deliberately darker than the pinned accent hexes — the accents
// themselves (#16A34A, #F59E0B, brand gold) fall well under the 4.5:1 WCAG
// AA ratio needed for 13px/500-weight text, even against their own near-
// white tint. These text-only shades exist solely to fix that; they don't
// change the brand palette (DESIGN.md's pinned values are untouched) and
// aren't used anywhere outside this one component.
const TONE_STYLES: Record<BadgeTone, string> = {
  success: 'bg-success/10 text-[#15803D]', // ~5:1 on the tint, vs 3.3:1 for #16A34A
  warning: 'bg-warning/10 text-[#B45309]', // ~5:1 on the tint, vs 2.15:1 for #F59E0B
  error: 'bg-error/10 text-error', // #DC2626 already passes at 4.83:1
  // Sable Doré (brand secondary) — used specifically for "waiting list",
  // deliberately distinct from the semantic warning amber.
  secondary: 'bg-secondary/10 text-[#6B4F1D]', // ~7.6:1 on the tint, vs 2.14:1 for #D1AC63
  neutral: 'bg-slate-100 text-slate-600',
}

interface StatusBadgeProps {
  tone: BadgeTone
  children: ReactNode
  className?: string
}

// The same status-pill visual (rounded-full px-3 py-1 text-xs font-medium,
// tinted by tone) used to be redeclared as a raw className string in 6+
// pages, each with its own local STATUS_STYLES lookup object duplicating
// the same 3-4 colors. This is that one shared visual; src/utils/statusTones.ts
// holds each domain's status -> tone mapping.
export function StatusBadge({ tone, children, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-block w-fit rounded-full px-3 py-1 text-xs font-medium',
        TONE_STYLES[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
