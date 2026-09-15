import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CalendarX } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { SkeletonRows } from '@/components/ui/SkeletonRows'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useMyRegistrations } from '@/features/dashboard/hooks/useDashboard'
import { cancelEventRegistration } from '@/features/events/services/eventsService'
import type { RegistrationDto } from '@/features/events/types'
import { REGISTRATION_STATUS_TONE } from '@/utils/statusTones'
import { TUNIS_TIMEZONE } from '@/utils/eventDays'

type ParticipationSort = 'date_asc' | 'date_desc'

function sortByEventDate(
  registrations: RegistrationDto[],
  sort: ParticipationSort,
): RegistrationDto[] {
  const sorted = [...registrations]
  return sorted.sort((a, b) => {
    const diff = new Date(a.event.startDate).getTime() - new Date(b.event.startDate).getTime()
    return sort === 'date_asc' ? diff : -diff
  })
}

export function ParticipationsPage() {
  const { t, i18n } = useTranslation()
  const { data: registrations, isLoading, isError } = useMyRegistrations()
  const queryClient = useQueryClient()
  const [sort, setSort] = useState<ParticipationSort>('date_asc')

  const cancelMutation = useMutation({
    mutationFn: (eventId: string) => cancelEventRegistration(eventId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['registrations'] })
      void queryClient.invalidateQueries({ queryKey: ['events'] })
    },
  })

  const now = new Date()
  const upcoming = useMemo(
    () =>
      sortByEventDate(
        (registrations ?? []).filter(
          (registration) => new Date(registration.event.startDate) >= now,
        ),
        sort,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [registrations, sort],
  )
  const past = useMemo(
    () =>
      sortByEventDate(
        (registrations ?? []).filter(
          (registration) => new Date(registration.event.startDate) < now,
        ),
        sort,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [registrations, sort],
  )

  function formatDate(value: string) {
    return new Date(value).toLocaleDateString(i18n.language === 'ar' ? 'ar-TN' : 'fr-TN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: TUNIS_TIMEZONE,
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
            loading={cancelMutation.isPending}
          >
            {t('events.cancelRegistration')}
          </Button>
        )}
      </Card>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-slate-900">{t('participations.title')}</h1>
        {!isLoading && (registrations ?? []).length > 0 && (
          <Select
            value={sort}
            onChange={(event) => setSort(event.target.value as ParticipationSort)}
            aria-label={t('participations.sort.label')}
            className="w-auto"
            options={[
              { value: 'date_asc', label: t('participations.sort.dateAsc') },
              { value: 'date_desc', label: t('participations.sort.dateDesc') },
            ]}
          />
        )}
      </div>

      {isLoading && <SkeletonRows count={4} />}
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
