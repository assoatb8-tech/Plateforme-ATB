import { Skeleton } from '@/components/ui/Skeleton'

interface SkeletonRowsProps {
  count?: number
  className?: string
}

// Placeholder for table/list content: a stack of bars matching a row shape,
// with alternating widths so it doesn't read as one uniform gray block.
export function SkeletonRows({ count = 5, className }: SkeletonRowsProps) {
  return (
    <div role="status" aria-label="loading" className={className ?? 'flex flex-col gap-3'}>
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton key={index} className={index % 2 === 0 ? 'h-10 w-full' : 'h-10 w-11/12'} />
      ))}
    </div>
  )
}
