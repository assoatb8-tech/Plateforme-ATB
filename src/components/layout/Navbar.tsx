import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Menu, X } from 'lucide-react'
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/features/auth/hooks/useAuth'
import type { AppUser } from '@/features/auth/hooks/AuthContext'

interface NavLinksProps {
  user: AppUser | null
  linkClassName: string
  onNavigate?: () => void
}

function NavLinks({ user, linkClassName, onNavigate }: NavLinksProps) {
  const { t } = useTranslation()

  return (
    <>
      <Link to="/" className={linkClassName} onClick={onNavigate}>
        {t('nav.home')}
      </Link>
      <Link to="/evenements" className={linkClassName} onClick={onNavigate}>
        {t('nav.events')}
      </Link>
      {user && (
        <Link to="/tableau-de-bord" className={linkClassName} onClick={onNavigate}>
          {t('nav.dashboard')}
        </Link>
      )}
      {user && (
        <Link to="/mes-participations" className={linkClassName} onClick={onNavigate}>
          {t('nav.participations')}
        </Link>
      )}
      {user && (
        <Link to="/mon-profil" className={linkClassName} onClick={onNavigate}>
          {t('nav.profile')}
        </Link>
      )}
      {user?.role === 'ADMIN' && (
        <Link to="/admin" className={linkClassName} onClick={onNavigate}>
          {t('nav.admin')}
        </Link>
      )}
    </>
  )
}

export function Navbar() {
  const { t } = useTranslation()
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleLogout() {
    setMobileOpen(false)
    // Navigate away from whatever page we're on BEFORE signing out, not
    // after — signOut() flips the auth state that ProtectedRoute watches,
    // and if we're still on a protected route when that happens,
    // ProtectedRoute's own redirect-to-/connexion races this one and wins,
    // landing the user on the login page instead of home.
    navigate('/')
    await signOut()
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-surface/95 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
          <img src="/logo.jpeg" alt={t('app.name')} className="h-12 w-12 rounded-full" />
          <span className="hidden text-sm font-semibold text-slate-900 sm:block">
            {t('app.name')}
          </span>
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          <NavLinks
            user={user}
            linkClassName="text-sm font-medium text-slate-700 hover:text-primary"
          />
        </div>

        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <div className="hidden items-center gap-2 md:flex">
            {user ? (
              <Button variant="ghost" onClick={() => void handleLogout()}>
                {t('nav.logout')}
              </Button>
            ) : (
              <>
                <Link to="/connexion">
                  <Button variant="ghost">{t('nav.login')}</Button>
                </Link>
                <Link to="/inscription">
                  <Button variant="primary">{t('nav.register')}</Button>
                </Link>
              </>
            )}
          </div>
          <button
            type="button"
            className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 md:hidden"
            aria-label={mobileOpen ? t('nav.closeMenu') : t('nav.openMenu')}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav-drawer"
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div
          id="mobile-nav-drawer"
          className="border-t border-slate-200 bg-surface px-4 py-4 md:hidden"
        >
          <div className="flex flex-col gap-1">
            <NavLinks
              user={user}
              linkClassName="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-primary"
              onNavigate={() => setMobileOpen(false)}
            />
          </div>
          <div className="mt-3 flex flex-col gap-2 border-t border-slate-200 pt-3">
            {user ? (
              <Button
                variant="ghost"
                onClick={() => void handleLogout()}
                className="justify-center"
              >
                {t('nav.logout')}
              </Button>
            ) : (
              <>
                <Link to="/connexion" onClick={() => setMobileOpen(false)}>
                  <Button variant="ghost" className="w-full justify-center">
                    {t('nav.login')}
                  </Button>
                </Link>
                <Link to="/inscription" onClick={() => setMobileOpen(false)}>
                  <Button variant="primary" className="w-full justify-center">
                    {t('nav.register')}
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
