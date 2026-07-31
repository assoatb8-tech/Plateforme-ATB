import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { HeartHandshake, ShieldCheck, Users, Sparkles, Quote } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { SponsorMarquee } from '@/features/sponsors/components/SponsorMarquee'

const valueIcons = [HeartHandshake, ShieldCheck, Users, Sparkles] as const
const valueKeys = ['solidarity', 'commitment', 'trust', 'community'] as const

export function HomePage() {
  const { t } = useTranslation()
  const { user } = useAuth()

  return (
    <div className="flex flex-col">
      <section className="bg-gradient-to-b from-primary/5 to-background">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-4 py-20 text-center sm:px-6">
          <img src="/logo.jpeg" alt={t('app.name')} className="h-24 w-24 rounded-full shadow-sm" />
          <h1 className="text-4xl font-bold text-slate-900 sm:text-5xl">{t('home.hero.title')}</h1>
          <p className="max-w-2xl text-base text-slate-600 sm:text-lg">{t('home.hero.subtitle')}</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {user ? (
              <Link to="/tableau-de-bord">
                <Button variant="primary">{t('home.hero.ctaDashboard')}</Button>
              </Link>
            ) : (
              <Link to="/inscription">
                <Button variant="primary">{t('home.hero.cta')}</Button>
              </Link>
            )}
            <Link to="/evenements">
              <Button variant="ghost">{t('home.hero.ctaSecondary')}</Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-primary/5 py-16">
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
          <Quote size={32} className="mx-auto mb-4 text-secondary" aria-hidden="true" />
          <p className="whitespace-pre-line text-xl font-medium italic leading-relaxed text-slate-800 sm:text-2xl">
            {t('home.motto.text')}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
        <h2 className="text-2xl font-semibold text-slate-900">{t('home.mission.title')}</h2>
        <p className="mt-4 text-base text-slate-600">{t('home.mission.text')}</p>
      </section>

      <section className="bg-surface py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-2xl font-semibold text-slate-900">
            {t('home.values.title')}
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {valueKeys.map((key, index) => {
              const Icon = valueIcons[index]
              return (
                <Card key={key} className="flex flex-col items-center gap-3 text-center">
                  <span className="rounded-full bg-primary/10 p-3 text-primary">
                    <Icon size={24} />
                  </span>
                  <h3 className="text-base font-semibold text-slate-900">
                    {t(`home.values.${key}`)}
                  </h3>
                  <p className="text-sm text-slate-600">{t(`home.values.${key}Text`)}</p>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
        <h2 className="text-2xl font-semibold text-slate-900">{t('home.contact.title')}</h2>
        <p className="mt-4 text-base text-slate-600">{t('home.contact.text')}</p>
      </section>

      <SponsorMarquee />
    </div>
  )
}
