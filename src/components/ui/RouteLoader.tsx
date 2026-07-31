import { Loader2 } from 'lucide-react'

// Full page/route-level equivalent of Spinner (src/components/ui/Spinner.tsx)
// — used wherever a whole route is waiting on something before it can
// render at all (lazy chunk load, initial auth check), not for loading
// states inside an already-rendered page.
export function RouteLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Loader2 size={28} className="animate-spin text-primary" />
    </div>
  )
}
