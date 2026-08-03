import { Skeleton } from '@/components/ui/Skeleton'

interface SkeletonCardsProps {
  count?: number
  className?: string
}

// Placeholder for card-grid content (Bureau, Sponsors, Events): each card
// mimics an avatar/title + two lines of text so the grid keeps its shape
// while data is still loading.
export function SkeletonCards({ count = 6, className }: SkeletonCardsProps) {
  return (
    <div
      role="status"
      aria-label="loading"
      className={className ?? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'}
    >
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="flex flex-col items-center gap-3 rounded-xl border border-slate-100 p-6"
        >
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      ))}
    </div>
  )
}
