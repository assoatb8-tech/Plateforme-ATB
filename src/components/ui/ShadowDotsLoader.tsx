import { cn } from '@/utils/cn'

interface ShadowDotsLoaderProps {
  size?: 'sm' | 'lg'
  className?: string
}

const DELAYS = ['0ms', '120ms', '240ms']

// Three dots, each lifting while a small shadow beneath it shrinks and
// fades in sync — replaces the old spinning icon everywhere in the app.
// Both dot and shadow use bg-current, inheriting whatever text color the
// caller is already in (a button's white/primary text, a <p>'s slate-500,
// etc.) — same behavior the old icon had with no color of its own, and
// critically what keeps a dot visible on a colored button instead of a
// hardcoded primary-red dot disappearing onto a primary-red background.
// motion-reduce:animate-none (Tailwind core, no plugin needed) keeps a
// static dot for users who've asked the OS to reduce motion.
export function ShadowDotsLoader({ size = 'sm', className }: ShadowDotsLoaderProps) {
  const dotSize = size === 'lg' ? 'h-3 w-3' : 'h-1.5 w-1.5'
  const shadowSize = size === 'lg' ? 'h-1 w-3' : 'h-0.5 w-1.5'
  const gap = size === 'lg' ? 'gap-3' : 'gap-1.5'

  return (
    <span role="status" aria-hidden="true" className={cn('inline-flex items-end', gap, className)}>
      {DELAYS.map((delay) => (
        <span key={delay} className="flex flex-col items-center gap-1">
          <span
            className={cn(
              'animate-shadow-bounce rounded-full bg-current motion-reduce:animate-none',
              dotSize,
            )}
            style={{ animationDelay: delay }}
          />
          <span
            className={cn(
              'animate-shadow-fade rounded-full bg-current motion-reduce:animate-none',
              shadowSize,
            )}
            style={{ animationDelay: delay }}
          />
        </span>
      ))}
    </span>
  )
}
