import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Calendar, CalendarDays, Facebook, MapPin, Users } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { SkeletonRows } from '@/components/ui/SkeletonRows'
import { ApiError } from '@/services/apiClient'
import { useAuth } from '@/features/auth/hooks/useAuth'
import {
  useCancelEventRegistration,
  useEvent,
  useRegisterForEvent,
  useUpdateMyEventDays,
} from '@/features/events/hooks/useEvents'
import { REGISTRATION_STATUS_TONE } from '@/utils/statusTones'
import { TUNIS_TIMEZONE } from '@/utils/eventDays'
import type { EventDayDto } from '@/features/events/types'

function formatDayLabel(day: EventDayDto, locale: string): string {
  const start = new Date(day.startAt)
  const end = new Date(day.endAt)
  const dateLabel = start.toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: TUNIS_TIMEZONE,
  })
  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TUNIS_TIMEZONE,
  }
  return `${dateLabel} · ${start.toLocaleTimeString(locale, timeOptions)}–${end.toLocaleTimeString(locale, timeOptions)}`
}

export function EventDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { t, i18n } = useTranslation()
  const { user } = useAuth()

  const { data: event, isLoading, isError } = useEvent(id)
  const registerMutation = useRegisterForEvent(id ?? '')
  const cancelMutation = useCancelEventRegistration(id ?? '')
  const updateDaysMutation = useUpdateMyEventDays(id ?? '')

  const [selectedDayIds, setSelectedDayIds] = useState<string[]>([])
  useEffect(() => {
    if (event) setSelectedDayIds(event.myRegistrationDayIds)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event?.id, event?.myRegistrationDayIds.join(',')])

  function toggleDay(dayId: string) {
    setSelectedDayIds((prev) =>
      prev.includes(dayId) ? prev.filter((existing) => existing !== dayId) : [...prev, dayId],
    )
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <SkeletonRows count={6} />
      </div>
    )
  }

  if (isError || !event) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-sm text-error">{t('events.notFound')}</p>
        <Link to="/evenements" className="mt-4 inline-block text-sm text-primary hover:underline">
          {t('events.backToList')}
        </Link>
      </div>
    )
  }

  const title = i18n.language === 'ar' ? event.titleAr : event.titleFr
  const description = i18n.language === 'ar' ? event.descriptionAr : event.descriptionFr
  const locale = i18n.language === 'ar' ? 'ar-TN' : 'fr-TN'
  const dateOptions: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TUNIS_TIMEZONE,
  }
  const startDate = new Date(event.startDate).toLocaleString(locale, dateOptions)
  const endDate = new Date(event.endDate).toLocaleString(locale, dateOptions)

  const isFull = event.spotsLeft <= 0
  const isCancelledEvent = event.status === 'CANCELLED'
  const isPastEvent = new Date(event.endDate) < new Date()
  const isRegistered = event.myRegistrationStatus === 'REGISTERED'
  const isWaitingList = event.myRegistrationStatus === 'WAITING_LIST'
  const mutationError = registerMutation.error ?? cancelMutation.error ?? updateDaysMutation.error
  const mutationErrorMessage = mutationError
    ? t(
        mutationError instanceof ApiError && mutationError.status === 409
          ? 'events.actionErrorAlreadyRegistered'
          : mutationError instanceof ApiError && mutationError.status === 429
            ? 'events.actionErrorRateLimited'
            : 'events.actionError',
      )
    : null
  const registrationBlockedReason =
    user && user.status === 'PENDING'
      ? 'events.registrationBlockedPending'
      : user && user.status === 'BANNED'
        ? 'events.registrationBlockedBanned'
        : null
  const canPickDays =
    Boolean(user) && !isCancelledEvent && !isPastEvent && !registrationBlockedReason

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link to="/evenements" className="mb-6 inline-block text-sm text-primary hover:underline">
        {t('events.backToList')}
      </Link>

      <Card className="flex flex-col gap-6">
        {event.bannerUrl && (
          <img
            src={event.bannerUrl}
            alt=""
            className="-mx-6 -mt-6 w-[calc(100%+3rem)] max-w-none rounded-t-xl"
          />
        )}
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
          {isCancelledEvent && (
            <StatusBadge tone="error" className="mt-2">
              {t('events.cancelled')}
            </StatusBadge>
          )}
        </div>

        <div className="flex flex-col gap-2 text-sm text-slate-600">
          <span className="flex items-center gap-2">
            {event.isMultiDay ? (
              <>
                <CalendarDays size={16} className="shrink-0" />
                {t('events.multiDayCount', { count: event.days.length })}
              </>
            ) : (
              <>
                <Calendar size={16} className="shrink-0" />
                {t('events.dateRange', { start: startDate, end: endDate })}
              </>
            )}
          </span>
          <span className="flex items-center gap-2">
            <MapPin size={16} className="shrink-0" />
            {event.location}
          </span>
          <span className="flex items-center gap-2">
            <Users size={16} className="shrink-0" />
            {t('events.capacity', {
              registered: event.registeredCount,
              max: event.maxParticipants,
            })}
          </span>
        </div>

        <p className="whitespace-pre-line text-sm text-slate-700">{description}</p>

        {event.isMultiDay && (
          <div className="flex flex-col gap-2 rounded-xl border border-slate-200 p-4">
            <p className="text-sm font-semibold text-slate-700">{t('events.pickYourDays')}</p>
            <div className="flex flex-col gap-2">
              {event.days.map((day) => (
                <Checkbox
                  key={day.id}
                  label={formatDayLabel(day, locale)}
                  checked={selectedDayIds.includes(day.id)}
                  disabled={!canPickDays}
                  onChange={() => toggleDay(day.id)}
                />
              ))}
            </div>
            {canPickDays && (isRegistered || isWaitingList) && (
              <Button
                type="button"
                variant="secondary"
                className="w-fit"
                disabled={updateDaysMutation.isPending || selectedDayIds.length === 0}
                loading={updateDaysMutation.isPending}
                onClick={() => updateDaysMutation.mutate(selectedDayIds)}
              >
                {t('events.updateMyDays')}
              </Button>
            )}
          </div>
        )}

        {event.facebookPostUrl && (
          <a
            href={event.facebookPostUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-fit items-center gap-2 rounded-xl bg-[#1877F2]/10 px-4 py-2.5 text-sm font-medium text-[#1877F2] transition-colors hover:bg-[#1877F2]/20"
          >
            <Facebook size={16} />
            {t('events.viewOnFacebook')}
          </a>
        )}

        {(isRegistered || isWaitingList) && (
          <StatusBadge
            tone={
              isRegistered
                ? REGISTRATION_STATUS_TONE.REGISTERED
                : REGISTRATION_STATUS_TONE.WAITING_LIST
            }
          >
            {isRegistered ? t('events.status.registered') : t('events.status.waitingList')}
          </StatusBadge>
        )}

        {mutationErrorMessage && <p className="text-sm text-error">{mutationErrorMessage}</p>}

        {!user && !isCancelledEvent && !isPastEvent && (
          <Link to="/connexion">
            <Button type="button">{t('events.loginToRegister')}</Button>
          </Link>
        )}

        {user &&
          !isCancelledEvent &&
          !isPastEvent &&
          !isRegistered &&
          !isWaitingList &&
          registrationBlockedReason && (
            <p className="text-sm text-slate-500">{t(registrationBlockedReason)}</p>
          )}

        {user &&
          !isCancelledEvent &&
          !isPastEvent &&
          !isRegistered &&
          !isWaitingList &&
          !registrationBlockedReason && (
            <Button
              type="button"
              onClick={() => registerMutation.mutate(event.isMultiDay ? selectedDayIds : undefined)}
              disabled={
                registerMutation.isPending || (event.isMultiDay && selectedDayIds.length === 0)
              }
              loading={registerMutation.isPending}
            >
              {isFull ? t('events.joinWaitingList') : t('events.register')}
            </Button>
          )}

        {user && !isPastEvent && (isRegistered || isWaitingList) && (
          <Button
            type="button"
            variant="danger"
            onClick={() => cancelMutation.mutate()}
            disabled={cancelMutation.isPending}
            loading={cancelMutation.isPending}
          >
            {t('events.cancelRegistration')}
          </Button>
        )}
      </Card>
    </div>
  )
}
