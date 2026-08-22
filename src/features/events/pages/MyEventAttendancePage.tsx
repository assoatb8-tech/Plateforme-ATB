import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, UserRound, Users } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { SkeletonRows } from '@/components/ui/SkeletonRows'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useEvent, useEventParticipants, useSetAttendance } from '@/features/events/hooks/useEvents'
import { REGISTRATION_STATUS_TONE } from '@/utils/statusTones'
import { resolveMemberDisplayName } from '@/utils/displayName'
import { useSignedPhotoUrls } from '@/hooks/useSignedPhotoUrls'
import { formatSelectedDays } from '@/utils/eventDays'
import { ApiError } from '@/services/apiClient'
import type { AttendanceStatus, RegistrationStatus } from '@/features/events/types'

const STATUS_LABEL_KEY: Record<RegistrationStatus, string> = {
  REGISTERED: 'events.status.registered',
  WAITING_LIST: 'events.status.waitingList',
  CANCELLED: 'events.status.cancelled',
}

// The "chef de groupe" counterpart to AdminEventParticipantsPage — same
// participants/attendance API (an ADMIN or the event's own leader, checked
// server-side by api/events/[id].ts's canManageEvent), but no admin chrome
// and no leader-assignment control (that stays admin-only).
export function MyEventAttendancePage() {
  const { t, i18n } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const { data: event } = useEvent(id)
  const { data: participants, isLoading, isError, error } = useEventParticipants(id)
  const photoUrls = useSignedPhotoUrls(
    participants?.map((participant) => participant.user.memberProfile?.photoUrl) ?? [],
  )

  const attendanceMutation = useSetAttendance(id ?? '')
  const [attendanceError, setAttendanceError] = useState<string | null>(null)
  const isEventEnded = Boolean(event && new Date(event.endDate) < new Date())
  const isForbidden = error instanceof ApiError && error.status === 403

  async function handleAttendance(
    registrationId: string,
    current: AttendanceStatus | null,
    next: AttendanceStatus,
  ) {
    setAttendanceError(null)
    try {
      await attendanceMutation.mutateAsync({
        registrationId,
        status: current === next ? null : next,
      })
    } catch {
      setAttendanceError(t('admin.events.participants.attendanceError'))
    }
  }

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
      {event && <p className="mb-6 text-sm text-slate-500">{event.titleFr}</p>}

      {attendanceError && <p className="mb-4 text-sm text-error">{attendanceError}</p>}

      {isLoading && (
        <Card className="p-4">
          <SkeletonRows count={5} />
        </Card>
      )}

      {isForbidden && <p className="text-sm text-error">{t('events.myLedEvents.forbidden')}</p>}
      {isError && !isForbidden && <p className="text-sm text-error">{t('admin.errorGeneric')}</p>}

      {!isLoading && !isError && participants && participants.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-200 py-20 text-center">
          <Users size={40} className="text-slate-300" />
          <p className="text-sm text-slate-500">{t('admin.events.participants.noneYet')}</p>
        </div>
      )}

      {!isLoading && participants && participants.length > 0 && (
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[560px] text-start text-sm">
            <thead className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">{t('admin.events.participants.columns.name')}</th>
                <th className="px-4 py-3">{t('admin.events.participants.columns.phone')}</th>
                <th className="px-4 py-3">{t('admin.events.participants.columns.status')}</th>
                {event?.isMultiDay && (
                  <th className="px-4 py-3">{t('admin.events.participants.columns.days')}</th>
                )}
                <th className="px-4 py-3">{t('admin.events.participants.columns.attendance')}</th>
              </tr>
            </thead>
            <tbody>
              {participants.map((participant) => (
                <tr key={participant.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-slate-800">
                    <div className="flex items-center gap-3">
                      {participant.user.memberProfile?.photoUrl &&
                      photoUrls[participant.user.memberProfile.photoUrl] ? (
                        <img
                          src={photoUrls[participant.user.memberProfile.photoUrl]}
                          alt=""
                          className="h-8 w-8 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-300">
                          <UserRound size={16} />
                        </span>
                      )}
                      {(participant.user.memberProfile &&
                        resolveMemberDisplayName(participant.user.memberProfile, i18n.language)) ||
                        t('admin.users.noName')}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {participant.user.memberProfile?.phoneMobile ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge tone={REGISTRATION_STATUS_TONE[participant.status]}>
                      {t(STATUS_LABEL_KEY[participant.status])}
                    </StatusBadge>
                  </td>
                  {event?.isMultiDay && (
                    <td className="px-4 py-3 text-slate-500">
                      {participant.daySelections.length > 0
                        ? formatSelectedDays(participant.daySelections, i18n.language)
                        : '—'}
                    </td>
                  )}
                  <td className="px-4 py-3">
                    {participant.status !== 'REGISTERED' ? (
                      <span className="text-slate-300">—</span>
                    ) : !isEventEnded ? (
                      <span className="text-xs text-slate-400">
                        {t('admin.events.participants.attendancePending')}
                      </span>
                    ) : (
                      <div className="flex gap-1.5">
                        <Button
                          type="button"
                          variant={participant.attendanceStatus === 'PRESENT' ? 'success' : 'ghost'}
                          disabled={attendanceMutation.isPending}
                          onClick={() =>
                            void handleAttendance(
                              participant.id,
                              participant.attendanceStatus,
                              'PRESENT',
                            )
                          }
                        >
                          {t('admin.events.participants.present')}
                        </Button>
                        <Button
                          type="button"
                          variant={participant.attendanceStatus === 'ABSENT' ? 'danger' : 'ghost'}
                          disabled={attendanceMutation.isPending}
                          onClick={() =>
                            void handleAttendance(
                              participant.id,
                              participant.attendanceStatus,
                              'ABSENT',
                            )
                          }
                        >
                          {t('admin.events.participants.absent')}
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}
