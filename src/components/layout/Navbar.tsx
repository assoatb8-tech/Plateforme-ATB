import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Menu, X } from 'lucide-react'
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher'
import { Button } from '@/components/ui/Button'
import { cn } from '@/utils/cn'
import { useAuth } from '@/features/auth/hooks/useAuth'
import type { AppUser } from '@/features/auth/hooks/AuthContext'

interface NavLinksProps {
  user: AppUser | null
  linkClassName: string
  activeLinkClassName: string
  onNavigate?: () => void
}

// "Mes participations" was removed on purpose — it's already reachable
// from the dashboard, and duplicating it here just added a sixth flat link.
function NavLinks({ user, linkClassName, activeLinkClassName, onNavigate }: NavLinksProps) {
  const { t } = useTranslation()

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(linkClassName, isActive && activeLinkClassName)

  return (
    <>
      <NavLink to="/" end className={linkClass} onClick={onNavigate}>
        {t('nav.home')}
      </NavLink>
      <NavLink to="/evenements" className={linkClass} onClick={onNavigate}>
        {t('nav.events')}
      </NavLink>
      {user && (
        <NavLink to="/tableau-de-bord" className={linkClass} onClick={onNavigate}>
          {t('nav.dashboard')}
        </NavLink>
      )}
      {user && (
        <NavLink to="/mon-profil" className={linkClass} onClick={onNavigate}>
          {t('nav.profile')}
        </NavLink>
      )}
      {user?.role === 'ADMIN' && (
        <NavLink to="/admin" className={linkClass} onClick={onNavigate}>
          {t('nav.admin')}
        </NavLink>
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
      <nav className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        {/* Both side zones are min-w-0 flex-1 — identical flex-basis/grow,
            so they always claim equal width regardless of how much content
            each one holds, which is what actually keeps the center nav
            centered (a plain 1fr/1fr grid doesn't: unequal min-content
            sizes on each side skew a grid's fr tracks unevenly). */}
        <div className="flex min-w-0 flex-1 items-center">
          <Link
            to="/"
            className="flex min-w-0 items-center gap-2.5"
            onClick={() => setMobileOpen(false)}
          >
            <img src="/logo.jpeg" alt={t('app.name')} className="h-11 w-11 shrink-0 rounded-full" />
            {/* Truncates with an ellipsis rather than overflowing into the
                center nav — at the narrow end of the lg: desktop range, an
                admin's 5 nav links leave this zone less room than the full
                name needs, and truncating is what actually prevents the
                overlap (the equal-width side zones only fix horizontal
                balance, not content that's wider than its share). */}
            <span className="hidden truncate text-sm font-semibold text-slate-900 sm:block">
              {t('app.name')}
            </span>
          </Link>
        </div>

        {/* Below 1024px this collapses into the hamburger drawer instead of
            squeezing onto one row — tablet gets the same clean treatment as
            mobile rather than a cramped horizontal nav. */}
        <div className="hidden shrink-0 items-center gap-8 lg:flex">
          <NavLinks
            user={user}
            linkClassName="whitespace-nowrap text-sm font-medium text-slate-600 transition-colors hover:text-primary"
            activeLinkClassName="text-primary"
          />
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-end gap-3">
          <LanguageSwitcher />
          <div className="hidden items-center gap-3 lg:flex">
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
            className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 lg:hidden"
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
          className="border-t border-slate-200 bg-surface px-4 py-4 lg:hidden"
        >
          <div className="flex flex-col gap-1">
            <NavLinks
              user={user}
              linkClassName="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-primary"
              activeLinkClassName="bg-primary/10 text-primary hover:bg-primary/10"
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
