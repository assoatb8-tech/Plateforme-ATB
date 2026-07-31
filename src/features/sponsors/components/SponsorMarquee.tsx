import { useTranslation } from 'react-i18next'
import { useSponsors } from '@/features/sponsors/hooks/useSponsors'

// Pure-CSS marquee (no carousel library) — the track renders the sponsor
// list twice back to back and animates translateX from -50% to 0
// (tailwind.config.ts's `marquee` keyframes), so the loop point lines up
// exactly on the seam between the two copies.
export function SponsorMarquee() {
  const { t } = useTranslation()
  const { data: sponsors } = useSponsors()

  if (!sponsors || sponsors.length === 0) return null

  const track = [...sponsors, ...sponsors]

  return (
    <section className="border-t border-slate-200 bg-surface py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="mb-8 text-center text-sm font-semibold uppercase tracking-wide text-slate-500">
          {t('home.sponsors.title')}
        </h2>
        <div
          className="group overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]"
          role="list"
          aria-label={t('home.sponsors.title')}
        >
          <div className="flex w-max animate-marquee items-center gap-16 group-hover:[animation-play-state:paused] motion-reduce:animate-none">
            {track.map((sponsor, index) => (
              <img
                key={`${sponsor.id}-${index}`}
                src={sponsor.logoUrl}
                alt={sponsor.name}
                role="listitem"
                className="h-12 w-auto shrink-0 object-contain grayscale transition-all hover:grayscale-0"
                loading="lazy"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
