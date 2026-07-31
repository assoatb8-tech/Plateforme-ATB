import { Loader2 } from 'lucide-react'
import { cn } from '@/utils/cn'

interface SpinnerProps {
  label: string
  className?: string
}

// The one visual for "this is loading" everywhere in the app — pairs with
// the route-level equivalent in src/App.tsx (RouteLoader), which stayed a
// one-off since it needs a taller/centered layout for a full page swap.
export function Spinner({ label, className }: SpinnerProps) {
  return (
    <p className={cn('flex items-center gap-2 text-sm text-slate-500', className)}>
      <Loader2 size={16} className="animate-spin" aria-hidden="true" />
      {label}
    </p>
  )
}
