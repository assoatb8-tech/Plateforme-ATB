import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

export type BadgeTone = 'success' | 'warning' | 'error' | 'secondary' | 'neutral'

const TONE_STYLES: Record<BadgeTone, string> = {
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  error: 'bg-error/10 text-error',
  // Sable Doré (brand secondary) — used specifically for "waiting list",
  // deliberately distinct from the semantic warning amber.
  secondary: 'bg-secondary/10 text-secondary',
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
