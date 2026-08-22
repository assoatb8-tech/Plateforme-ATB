import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Crown, UserRound, Users } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { SkeletonRows } from '@/components/ui/SkeletonRows'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useAdminEvent, useAssignEventLeader } from '@/features/admin/events/hooks/useAdminEvents'
import { useEventParticipants, useSetAttendance } from '@/features/events/hooks/useEvents'
import { REGISTRATION_STATUS_TONE } from '@/utils/statusTones'
import { resolveMemberDisplayName } from '@/utils/displayName'
import { useSignedPhotoUrls } from '@/hooks/useSignedPhotoUrls'
import { formatSelectedDays } from '@/utils/eventDays'
import type { AttendanceStatus, RegistrationStatus } from '@/features/events/types'

const STATUS_LABEL_KEY: Record<RegistrationStatus, string> = {
  REGISTERED: 'events.status.registered',
  WAITING_LIST: 'events.status.waitingList',
  CANCELLED: 'events.status.cancelled',
}

export function AdminEventParticipantsPage() {
  const { t, i18n } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const { data: event } = useAdminEvent(id)
  const { data: participants, isLoading, isError } = useEventParticipants(id)
  const photoUrls = useSignedPhotoUrls(
    participants?.map((participant) => participant.user.memberProfile?.photoUrl) ?? [],
  )
  const leaderMutation = useAssignEventLeader(id ?? '')
  const [leaderError, setLeaderError] = useState<string | null>(null)

  async function handleLeaderToggle(userId: string, isCurrentLeader: boolean) {
    setLeaderError(null)
    try {
      await leaderMutation.mutateAsync(isCurrentLeader ? null : userId)
    } catch {
      setLeaderError(t('admin.events.participants.leaderError'))
    }
  }

  const attendanceMutation = useSetAttendance(id ?? '')
  const [attendanceError, setAttendanceError] = useState<string | null>(null)
  const isEventEnded = Boolean(event && new Date(event.endDate) < new Date())

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
    <div className="flex flex-col gap-6">
      <div>
        <Link
          to="/admin/evenements"
          className="mb-2 inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          <ArrowLeft size={16} className="rtl:-scale-x-100" />
          {t('admin.events.back')}
        </Link>
        <h1 className="text-2xl font-semibold text-slate-900">
          {t('admin.events.participants.title')}
        </h1>
        {event && <p className="text-sm text-slate-500">{event.titleFr}</p>}
      </div>

      {leaderError && <p className="text-sm text-error">{leaderError}</p>}
      {attendanceError && <p className="text-sm text-error">{attendanceError}</p>}

      {isLoading && (
        <Card className="p-4">
          <SkeletonRows count={5} />
        </Card>
      )}
      {isError && <p className="text-sm text-error">{t('admin.errorGeneric')}</p>}

      {!isLoading && !isError && participants && participants.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-200 py-20 text-center">
          <Users size={40} className="text-slate-300" />
          <p className="text-sm text-slate-500">{t('admin.events.participants.noneYet')}</p>
        </div>
      )}

      {!isLoading && participants && participants.length > 0 && (
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[640px] text-start text-sm">
            <thead className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">{t('admin.events.participants.columns.name')}</th>
                <th className="px-4 py-3">{t('admin.events.participants.columns.phone')}</th>
                <th className="px-4 py-3">{t('admin.events.participants.columns.email')}</th>
                <th className="px-4 py-3">{t('admin.events.participants.columns.status')}</th>
                <th className="px-4 py-3">{t('admin.events.participants.columns.date')}</th>
                {event?.isMultiDay && (
                  <th className="px-4 py-3">{t('admin.events.participants.columns.days')}</th>
                )}
                <th className="px-4 py-3">{t('admin.events.participants.columns.attendance')}</th>
                <th className="px-4 py-3 text-end">
                  {t('admin.events.participants.columns.leader')}
                </th>
              </tr>
            </thead>
            <tbody>
              {participants.map((participant) => {
                const isCurrentLeader = event?.leaderId === participant.user.id
                return (
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
                          resolveMemberDisplayName(
                            participant.user.memberProfile,
                            i18n.language,
                          )) ||
                          t('admin.users.noName')}
                        {isCurrentLeader && (
                          <span title={t('admin.events.participants.leader')}>
                            <Crown size={14} className="shrink-0 text-secondary" />
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {participant.user.memberProfile?.phoneMobile ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{participant.user.email}</td>
                    <td className="px-4 py-3">
                      <StatusBadge tone={REGISTRATION_STATUS_TONE[participant.status]}>
                        {t(STATUS_LABEL_KEY[participant.status])}
                      </StatusBadge>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(participant.registeredAt).toLocaleDateString()}
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
                            variant={
                              participant.attendanceStatus === 'PRESENT' ? 'success' : 'ghost'
                            }
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
                    <td className="px-4 py-3 text-end">
                      {participant.status === 'REGISTERED' && (
                        <Button
                          type="button"
                          variant={isCurrentLeader ? 'danger' : 'secondary'}
                          disabled={leaderMutation.isPending}
                          onClick={() =>
                            void handleLeaderToggle(participant.user.id, isCurrentLeader)
                          }
                        >
                          {isCurrentLeader
                            ? t('admin.events.participants.removeLeader')
                            : t('admin.events.participants.makeLeader')}
                        </Button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}
