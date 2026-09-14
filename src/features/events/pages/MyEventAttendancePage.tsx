import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
import { useEvent, useEventParticipants } from '@/features/events/hooks/useEvents'
import { ParticipantsTable } from '@/features/events/components/ParticipantsTable'
import { ApiError } from '@/services/apiClient'

// The "chef de groupe" counterpart to AdminEventParticipantsPage — same
// participants API (an ADMIN or the event's own leader, checked
// server-side by api/events/[id].ts's canManageEvent), but no admin chrome
// and a leaner table (see ParticipantsTable's mode prop).
export function MyEventAttendancePage() {
  const { t, i18n } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const { data: event } = useEvent(id)
  const { data: participants, isLoading, isError, error } = useEventParticipants(id)
  const isForbidden = error instanceof ApiError && error.status === 403

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <Link
        to="/tableau-de-bord"
        className="mb-6 inline-flex items-center gap-1 text-sm text-primary hover:underline"
      >
        <ArrowLeft size={16} className="rtl:-scale-x-100" />
        {t('nav.dashboard')}
      </Link>

      <h1 className="mb-1 text-2xl font-semibold text-slate-900">
        {t('admin.events.participants.title')}
      </h1>
      {event && (
        <p className="mb-6 text-sm text-slate-500">
          {i18n.language === 'ar' ? event.titleAr : event.titleFr}
        </p>
      )}

      {isForbidden ? (
        <p className="text-sm text-error">{t('events.myLedEvents.forbidden')}</p>
      ) : (
        <ParticipantsTable
          mode="leader"
          event={event}
          participants={participants}
          isLoading={isLoading}
          isError={isError}
        />
      )}
    </div>
  )
}
