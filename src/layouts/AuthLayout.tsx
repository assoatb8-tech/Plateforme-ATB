import { Link, Navigate, Outlet, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher'
import { useAuth } from '@/features/auth/hooks/useAuth'

// /reinitialiser-mot-de-passe is reached via Supabase's password-recovery
// link, which establishes a real session before the user has set a new
// password — that route must stay reachable while "authenticated", unlike
// /connexion and /inscription.
const SESSION_EXEMPT_PATH = '/reinitialiser-mot-de-passe'

export function AuthLayout() {
  const { t } = useTranslation()
  const { session, user, loading } = useAuth()
  const location = useLocation()

  if (!loading && session && user && location.pathname !== SESSION_EXEMPT_PATH) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="absolute end-4 top-4">
        <LanguageSwitcher />
      </div>

      <Link to="/" className="mb-6 flex flex-col items-center gap-2">
        <img src="/logo.jpeg" alt={t('app.name')} className="h-24 w-24 rounded-full shadow-sm" />
        <span className="text-sm font-semibold text-slate-900">{t('app.name')}</span>
      </Link>

      <main className="w-full max-w-md">
        <Outlet />
      </main>
    </div>
  )
}
