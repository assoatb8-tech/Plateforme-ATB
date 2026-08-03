import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CalendarCheck, ClipboardList, UserRound } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { SkeletonRows } from '@/components/ui/SkeletonRows'
import { SkeletonCards } from '@/components/ui/SkeletonCards'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useCurrentUserProfile, useMyRegistrations } from '@/features/dashboard/hooks/useDashboard'
import { RegistrationCard } from '@/features/events/components/RegistrationCard'
import { USER_STATUS_TONE } from '@/utils/statusTones'

export function DashboardPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const {
    data: currentUser,
    isLoading: isLoadingUser,
    isError: isUserError,
  } = useCurrentUserProfile()
  const {
    data: registrations,
    isLoading: isLoadingRegistrations,
    isError: isRegistrationsError,
  } = useMyRegistrations()

  const upcomingRegistrations = (registrations ?? [])
    .filter((registration) => new Date(registration.event.startDate) >= new Date())
    .slice(0, 3)

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="mb-8 text-2xl font-semibold text-slate-900">
        {t('dashboard.greeting', { email: user?.email ?? '' })}
      </h1>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="flex flex-col gap-3 md:col-span-1">
          <div className="flex items-center gap-2 text-slate-500">
            <UserRound size={20} />
            <h2 className="text-sm font-semibold uppercase tracking-wide">
              {t('dashboard.membershipStatus')}
            </h2>
          </div>

          {isLoadingUser && <SkeletonRows count={2} className="flex flex-col gap-2" />}

          {isUserError && <p className="text-sm text-error">{t('dashboard.errorGeneric')}</p>}

          {!isLoadingUser && !isUserError && currentUser && (
            <StatusBadge tone={USER_STATUS_TONE[currentUser.status]}>
              {t(`dashboard.status.${currentUser.status}`)}
            </StatusBadge>
          )}

          {currentUser && !currentUser.hasProfile && currentUser.isProtected && (
            <p className="mt-2 text-sm text-slate-600">
              {t('profile.universalAdminNoProfileNeeded')}
            </p>
          )}

          {currentUser && !currentUser.hasProfile && !currentUser.isProtected && (
            <div className="mt-2 flex flex-col gap-2">
              <p className="text-sm text-slate-600">{t('dashboard.noProfileYet')}</p>
              <Link to="/dossier-adhesion">
                <Button type="button">{t('dashboard.completeProfileCta')}</Button>
              </Link>
            </div>
          )}

          {currentUser?.hasProfile && (
            <Link to="/mon-profil" className="text-sm text-primary hover:underline">
              {t('dashboard.viewProfile')}
            </Link>
          )}

          {currentUser?.hasProfile && !currentUser.hasPhoto && (
            <div className="mt-2 flex flex-col gap-2 rounded-xl bg-amber-50 p-3">
              <p className="text-sm text-amber-800">{t('dashboard.missingPhoto')}</p>
              <Link to="/mon-profil">
                <Button type="button" variant="secondary">
                  {t('dashboard.addPhotoCta')}
                </Button>
              </Link>
            </div>
          )}
        </Card>

        <Card className="flex flex-col gap-3 md:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-500">
              <CalendarCheck size={20} />
              <h2 className="text-sm font-semibold uppercase tracking-wide">
                {t('dashboard.upcomingEvents')}
              </h2>
            </div>
            <Link
              to="/mes-participations"
              className="flex items-center gap-1 text-sm text-primary hover:underline"
            >
              <ClipboardList size={16} />
              {t('dashboard.viewAllParticipations')}
            </Link>
          </div>

          {isLoadingRegistrations && <SkeletonCards count={2} />}

          {isRegistrationsError && (
            <p className="text-sm text-error">{t('dashboard.errorGeneric')}</p>
          )}

          {!isLoadingRegistrations &&
            !isRegistrationsError &&
            upcomingRegistrations.length === 0 && (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <p className="text-sm text-slate-500">{t('dashboard.noUpcomingEvents')}</p>
                <Link to="/evenements">
                  <Button type="button" variant="secondary">
                    {t('dashboard.browseEvents')}
                  </Button>
                </Link>
              </div>
            )}

          {upcomingRegistrations.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {upcomingRegistrations.map((registration) => (
                <RegistrationCard key={registration.id} registration={registration} />
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
