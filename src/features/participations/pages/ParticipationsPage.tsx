import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CalendarX } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useMyRegistrations } from '@/features/dashboard/hooks/useDashboard'
import { cancelEventRegistration } from '@/features/events/services/eventsService'
import type { RegistrationDto } from '@/features/events/types'
import { REGISTRATION_STATUS_TONE } from '@/utils/statusTones'

export function ParticipationsPage() {
  const { t, i18n } = useTranslation()
  const { data: registrations, isLoading, isError } = useMyRegistrations()
  const queryClient = useQueryClient()

  const cancelMutation = useMutation({
    mutationFn: (eventId: string) => cancelEventRegistration(eventId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['registrations'] })
      void queryClient.invalidateQueries({ queryKey: ['events'] })
    },
  })

  const now = new Date()
  const upcoming = (registrations ?? []).filter(
    (registration) => new Date(registration.event.startDate) >= now,
  )
  const past = (registrations ?? []).filter(
    (registration) => new Date(registration.event.startDate) < now,
  )

  function formatDate(value: string) {
    return new Date(value).toLocaleDateString(i18n.language === 'ar' ? 'ar-TN' : 'fr-TN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  function renderRow(registration: RegistrationDto, allowCancel: boolean) {
    const title = i18n.language === 'ar' ? registration.event.titleAr : registration.event.titleFr
    return (
      <Card
        key={registration.id}
        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex flex-col gap-1">
          <Link
            to={`/evenements/${registration.event.id}`}
            className="font-medium text-slate-900 hover:underline"
          >
            {title}
          </Link>
          <span className="text-sm text-slate-500">
            {formatDate(registration.event.startDate)} · {registration.event.location}
          </span>
          <StatusBadge tone={REGISTRATION_STATUS_TONE[registration.status]}>
            {registration.status === 'REGISTERED'
              ? t('events.status.registered')
              : t('events.status.waitingList')}
          </StatusBadge>
        </div>

        {allowCancel && (
          <Button
            type="button"
            variant="danger"
            onClick={() => cancelMutation.mutate(registration.event.id)}
            disabled={cancelMutation.isPending}
          >
            {t('events.cancelRegistration')}
          </Button>
        )}
      </Card>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="mb-8 text-2xl font-semibold text-slate-900">{t('participations.title')}</h1>

      {isLoading && <p className="text-sm text-slate-500">{t('dashboard.loading')}</p>}
      {isError && <p className="text-sm text-error">{t('events.errorGeneric')}</p>}

      {!isLoading && !isError && (registrations ?? []).length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-200 py-20 text-center">
          <CalendarX size={40} className="text-slate-300" />
          <p className="text-sm text-slate-500">{t('participations.empty')}</p>
          <Link to="/evenements">
            <Button type="button" variant="secondary">
              {t('dashboard.browseEvents')}
            </Button>
          </Link>
        </div>
      )}

      {!isLoading && upcoming.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">
            {t('participations.upcoming')}
          </h2>
          <div className="flex flex-col gap-3">
            {upcoming.map((registration) => renderRow(registration, true))}
          </div>
        </section>
      )}

      {!isLoading && past.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-slate-800">{t('participations.past')}</h2>
          <div className="flex flex-col gap-3">
            {past.map((registration) => renderRow(registration, false))}
          </div>
        </section>
      )}
    </div>
  )
}
