import { ShadowDotsLoader } from '@/components/ui/ShadowDotsLoader'

// Full page/route-level equivalent of Spinner (src/components/ui/Spinner.tsx)
// — used wherever a whole route is waiting on something before it can
// render at all (lazy chunk load, initial auth check), not for loading
// states inside an already-rendered page.
export function RouteLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center text-primary">
      <ShadowDotsLoader size="lg" />
    </div>
  )
}
