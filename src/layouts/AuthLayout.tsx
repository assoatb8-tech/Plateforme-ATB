import { Link, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher'

export function AuthLayout() {
  const { t } = useTranslation()

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="absolute end-4 top-4">
        <LanguageSwitcher />
      </div>

      <Link to="/" className="mb-6 flex flex-col items-center gap-2">
        <img src="/logo.jpeg" alt={t('app.name')} className="h-24 w-24 rounded-full shadow-sm" />
        <span className="text-sm font-semibold text-slate-900">{t('app.name')}</span>
      </Link>

      <div className="w-full max-w-md">
        <Outlet />
      </div>
    </div>
  )
}
