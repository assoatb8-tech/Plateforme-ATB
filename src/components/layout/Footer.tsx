import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export function Footer() {
  const { t } = useTranslation()
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-slate-200 bg-surface">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-8 text-center sm:px-6">
        <img
          src="/logo.jpeg"
          alt={t('app.name')}
          loading="lazy"
          className="h-14 w-14 rounded-full"
        />
        <p className="text-sm font-medium text-slate-700">{t('footer.tagline')}</p>
        <Link to="/bureau" className="text-sm text-primary hover:underline">
          {t('home.contact.title')}
        </Link>
        <p className="text-xs text-slate-400">
          © {year} {t('app.shortName')} — {t('footer.rights')}
        </p>
      </div>
    </footer>
  )
}
