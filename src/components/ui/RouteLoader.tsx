import { ShadowDotsLoader } from '@/components/ui/ShadowDotsLoader'

// Used wherever a whole route is waiting on something before it can render
// at all (lazy chunk load, initial auth check) — content-area loading states
// inside an already-rendered page use skeleton loaders instead (see
// src/components/ui/SkeletonRows.tsx / SkeletonCards.tsx).
export function RouteLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center text-primary">
      <ShadowDotsLoader size="lg" />
    </div>
  )
}
