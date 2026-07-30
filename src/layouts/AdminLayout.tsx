import { NavLink, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LayoutDashboard, Users, CalendarDays, Wallet } from 'lucide-react'
import { cn } from '@/utils/cn'

const NAV_ITEMS = [
  { to: '/admin', end: true, icon: LayoutDashboard, labelKey: 'admin.nav.dashboard' },
  { to: '/admin/membres', end: false, icon: Users, labelKey: 'admin.nav.members' },
  { to: '/admin/evenements', end: false, icon: CalendarDays, labelKey: 'admin.nav.events' },
  { to: '/admin/cotisations', end: false, icon: Wallet, labelKey: 'admin.nav.payments' },
] as const

export function AdminLayout() {
  const { t } = useTranslation()

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 md:flex-row">
      <aside className="shrink-0 md:w-56">
        <h1 className="mb-4 text-lg font-semibold text-slate-900">{t('admin.title')}</h1>
        <div className="relative md:static">
          <nav
            aria-label={t('admin.title')}
            className="flex flex-row gap-1 overflow-x-auto md:flex-col md:overflow-visible"
          >
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition-colors',
                    isActive ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:bg-slate-100',
                  )
                }
              >
                <item.icon size={18} />
                {t(item.labelKey)}
              </NavLink>
            ))}
          </nav>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 end-0 w-8 bg-gradient-to-l from-white to-transparent md:hidden rtl:bg-gradient-to-r"
          />
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <Outlet />
      </div>
    </div>
  )
}
