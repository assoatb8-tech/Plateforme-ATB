import { useTranslation } from 'react-i18next'
import { Users, UserPlus, CalendarCheck, ClipboardList, Wallet } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { useAdminStats } from '@/features/admin/dashboard/hooks/useAdminStats'
import type { AdminStatsDto } from '@/features/admin/dashboard/types'

const STAT_ITEMS: Array<{ key: keyof AdminStatsDto; icon: typeof Users }> = [
  { key: 'totalMembers', icon: Users },
  { key: 'newMembers', icon: UserPlus },
  { key: 'activeEvents', icon: CalendarCheck },
  { key: 'totalRegistrations', icon: ClipboardList },
  { key: 'pendingPayments', icon: Wallet },
]

export function AdminDashboardPage() {
  const { t } = useTranslation()
  const { data, isLoading, isError } = useAdminStats()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{t('admin.dashboard.title')}</h1>
        <p className="text-sm text-slate-500">{t('admin.dashboard.subtitle')}</p>
      </div>

      {isLoading && <p className="text-sm text-slate-500">{t('admin.loading')}</p>}
      {isError && <p className="text-sm text-error">{t('admin.errorGeneric')}</p>}

      {data && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {STAT_ITEMS.map((item) => (
            <Card key={item.key} className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <item.icon size={22} />
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">{data[item.key]}</p>
                <p className="text-sm text-slate-500">{t(`admin.dashboard.stats.${item.key}`)}</p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
