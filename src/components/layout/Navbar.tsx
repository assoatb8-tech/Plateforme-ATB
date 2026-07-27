import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/features/auth/hooks/useAuth'

export function Navbar() {
  const { t } = useTranslation()
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await signOut()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-surface/95 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo.jpeg" alt={t('app.name')} className="h-12 w-12 rounded-full" />
          <span className="hidden text-sm font-semibold text-slate-900 sm:block">
            {t('app.name')}
          </span>
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          <Link to="/" className="text-sm font-medium text-slate-700 hover:text-primary">
            {t('nav.home')}
          </Link>
          <Link to="/evenements" className="text-sm font-medium text-slate-700 hover:text-primary">
            {t('nav.events')}
          </Link>
          {user && (
            <Link
              to="/tableau-de-bord"
              className="text-sm font-medium text-slate-700 hover:text-primary"
            >
              {t('nav.dashboard')}
            </Link>
          )}
          {user?.role === 'ADMIN' && (
            <Link to="/admin" className="text-sm font-medium text-slate-700 hover:text-primary">
              {t('nav.admin')}
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          {user ? (
            <Button variant="ghost" onClick={() => void handleLogout()}>
              {t('nav.logout')}
            </Button>
          ) : (
            <>
              <Link to="/connexion" className="hidden sm:block">
                <Button variant="ghost">{t('nav.login')}</Button>
              </Link>
              <Link to="/inscription">
                <Button variant="primary">{t('nav.register')}</Button>
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  )
}
