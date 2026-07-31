import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { Navbar } from './Navbar'
import { AuthContext, type AuthContextValue } from '@/features/auth/hooks/AuthContext'

// Isolates this test from the real i18next setup — only the auth-loading
// behavior is under test here, so `t` just echoes its key back.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'fr', changeLanguage: vi.fn() },
  }),
}))

function renderNavbar(authValue: AuthContextValue) {
  return render(
    <MemoryRouter>
      <AuthContext.Provider value={authValue}>
        <Navbar />
      </AuthContext.Provider>
    </MemoryRouter>,
  )
}

const baseAuth = { session: null, signOut: vi.fn() }

describe('Navbar auth-state rendering', () => {
  // Regression test for the bug found during the production-readiness
  // audit: on a hard reload of an authenticated session, the navbar used
  // to render the guest Login/Register buttons for the brief window while
  // AuthProvider's session restore was still in flight (loading: true,
  // user: null) — a false "you're not logged in" flash. Neither the guest
  // buttons nor the logout button should render while loading is true,
  // regardless of what `user` happens to be at that moment.
  it('renders neither guest nor authenticated actions while loading', () => {
    renderNavbar({ ...baseAuth, user: null, loading: true })

    expect(screen.queryByText('nav.login')).not.toBeInTheDocument()
    expect(screen.queryByText('nav.register')).not.toBeInTheDocument()
    expect(screen.queryByText('nav.logout')).not.toBeInTheDocument()
  })

  it('renders guest actions once loading resolves with no user', () => {
    renderNavbar({ ...baseAuth, user: null, loading: false })

    expect(screen.getAllByText('nav.login').length).toBeGreaterThan(0)
    expect(screen.getAllByText('nav.register').length).toBeGreaterThan(0)
    expect(screen.queryByText('nav.logout')).not.toBeInTheDocument()
  })

  it('renders the logout action once loading resolves with a signed-in user', () => {
    renderNavbar({
      ...baseAuth,
      loading: false,
      user: { id: 'u1', email: 'a@b.com', role: 'USER', status: 'ACTIVE' },
    })

    expect(screen.getAllByText('nav.logout').length).toBeGreaterThan(0)
    expect(screen.queryByText('nav.login')).not.toBeInTheDocument()
    expect(screen.queryByText('nav.register')).not.toBeInTheDocument()
  })

  it('only shows the admin link for an ADMIN user, never for a regular USER', () => {
    const { rerender } = renderNavbar({
      ...baseAuth,
      loading: false,
      user: { id: 'u1', email: 'a@b.com', role: 'USER', status: 'ACTIVE' },
    })
    expect(screen.queryByText('nav.admin')).not.toBeInTheDocument()

    rerender(
      <MemoryRouter>
        <AuthContext.Provider
          value={{
            ...baseAuth,
            loading: false,
            user: { id: 'u2', email: 'admin@b.com', role: 'ADMIN', status: 'ACTIVE' },
          }}
        >
          <Navbar />
        </AuthContext.Provider>
      </MemoryRouter>,
    )
    expect(screen.getAllByText('nav.admin').length).toBeGreaterThan(0)
  })
})
