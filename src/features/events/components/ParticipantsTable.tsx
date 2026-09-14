import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Crown, Pencil, UserMinus, UserRound, Users } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { SkeletonRows } from '@/components/ui/SkeletonRows'
import { useAssignEventLeader } from '@/features/admin/events/hooks/useAdminEvents'
import { useRemoveParticipant, useSetAttendance } from '@/features/events/hooks/useEvents'
import { REGISTRATION_STATUS_TONE } from '@/utils/statusTones'
import { resolveMemberDisplayName } from '@/utils/displayName'
import { useSignedPhotoUrls } from '@/hooks/useSignedPhotoUrls'
import { formatSelectedDays } from '@/utils/eventDays'
import { EditParticipantModal } from '@/features/events/components/EditParticipantModal'
import type {
  AttendanceStatus,
  EventDto,
  EventParticipantDto,
  ParticipantSort,
  RegistrationStatus,
} from '@/features/events/types'

const STATUS_LABEL_KEY: Record<RegistrationStatus, string> = {
  REGISTERED: 'events.status.registered',
  WAITING_LIST: 'events.status.waitingList',
  CANCELLED: 'events.status.cancelled',
}

function participantName(
  participant: EventParticipantDto,
  language: string,
  t: (k: string) => string,
) {
  return (
    (participant.user.memberProfile &&
      resolveMemberDisplayName(participant.user.memberProfile, language)) ||
    t('admin.users.noName')
  )
}

function sortParticipants(
  participants: EventParticipantDto[],
  sort: ParticipantSort,
  language: string,
  t: (k: string) => string,
): EventParticipantDto[] {
  const sorted = [...participants]
  switch (sort) {
    case 'name_asc':
      return sorted.sort((a, b) =>
        participantName(a, language, t).localeCompare(participantName(b, language, t), language),
      )
    case 'name_desc':
      return sorted.sort((a, b) =>
        participantName(b, language, t).localeCompare(participantName(a, language, t), language),
      )
    case 'joined_desc':
      return sorted.sort(
        (a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime(),
      )
    case 'joined_asc':
    default:
      return sorted.sort(
        (a, b) => new Date(a.registeredAt).getTime() - new Date(b.registeredAt).getTime(),
      )
  }
}

interface ParticipantsTableProps {
  // 'admin' gets email/registration-date columns, leader assignment, edit,
  // and unrestricted removal. 'leader' ("chef de groupe") gets a leaner
  // table and can only remove a participant before the event starts.
  mode: 'admin' | 'leader'
  event: EventDto | undefined
  participants: EventParticipantDto[] | undefined
  isLoading: boolean
  isError: boolean
  onAddParticipant?: () => void
}

export function ParticipantsTable({
  mode,
  event,
  participants,
  isLoading,
  isError,
  onAddParticipant,
}: ParticipantsTableProps) {
  const { t, i18n } = useTranslation()
  const eventId = event?.id ?? ''
  const [sort, setSort] = useState<ParticipantSort>('joined_asc')
  const [editingParticipant, setEditingParticipant] = useState<EventParticipantDto | null>(null)
  const [rowError, setRowError] = useState<string | null>(null)

  const photoUrls = useSignedPhotoUrls(
    (participants ?? []).map((participant) => participant.user.memberProfile?.photoUrl),
  )
  const leaderMutation = useAssignEventLeader(eventId)
  const attendanceMutation = useSetAttendance(eventId)
  const removeMutation = useRemoveParticipant(eventId)

  const isEventEnded = Boolean(event && new Date(event.endDate) < new Date())
  const isEventStarted = Boolean(event && new Date(event.startDate) <= new Date())
  const canRemove = mode === 'admin' || !isEventStarted

  const sorted = useMemo(
    () => sortParticipants(participants ?? [], sort, i18n.language, t),
    [participants, sort, i18n.language, t],
  )

  async function handleLeaderToggle(userId: string, isCurrentLeader: boolean) {
    setRowError(null)
    try {
      await leaderMutation.mutateAsync(isCurrentLeader ? null : userId)
    } catch {
      setRowError(t('admin.events.participants.leaderError'))
    }
  }

  async function handleAttendance(
    registrationId: string,
    current: AttendanceStatus | null,
    next: AttendanceStatus,
  ) {
    setRowError(null)
    try {
      await attendanceMutation.mutateAsync({
        registrationId,
        status: current === next ? null : next,
      })
    } catch {
      setRowError(t('admin.events.participants.attendanceError'))
    }
  }

  async function handleRemove(registrationId: string) {
    setRowError(null)
    try {
      await removeMutation.mutateAsync(registrationId)
    } catch {
      setRowError(t('admin.events.participants.remove.error'))
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Select
          value={sort}
          onChange={(event_) => setSort(event_.target.value as ParticipantSort)}
          aria-label={t('admin.events.participants.sort.label')}
          className="w-auto"
          options={[
            { value: 'joined_asc', label: t('admin.events.participants.sort.joinedAsc') },
            { value: 'joined_desc', label: t('admin.events.participants.sort.joinedDesc') },
            { value: 'name_asc', label: t('admin.events.participants.sort.nameAsc') },
            { value: 'name_desc', label: t('admin.events.participants.sort.nameDesc') },
          ]}
        />
        {mode === 'admin' && onAddParticipant && (
          <Button type="button" variant="secondary" onClick={onAddParticipant}>
            {t('admin.events.participants.add.action')}
          </Button>
        )}
      </div>

      {rowError && <p className="text-sm text-error">{rowError}</p>}

      {isLoading && (
        <Card className="p-4">
          <SkeletonRows count={5} />
        </Card>
      )}
      {isError && <p className="text-sm text-error">{t('admin.errorGeneric')}</p>}

      {!isLoading && !isError && sorted.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-200 py-20 text-center">
          <Users size={40} className="text-slate-300" />
          <p className="text-sm text-slate-500">{t('admin.events.participants.noneYet')}</p>
        </div>
      )}

      {!isLoading && sorted.length > 0 && (
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[640px] text-start text-sm">
            <thead className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">{t('admin.events.participants.columns.name')}</th>
                <th className="px-4 py-3">{t('admin.events.participants.columns.phone')}</th>
                {mode === 'admin' && (
                  <th className="px-4 py-3">{t('admin.events.participants.columns.email')}</th>
                )}
                <th className="px-4 py-3">{t('admin.events.participants.columns.status')}</th>
                {mode === 'admin' && (
                  <th className="px-4 py-3">{t('admin.events.participants.columns.date')}</th>
                )}
                {event?.isMultiDay && (
                  <th className="px-4 py-3">{t('admin.events.participants.columns.days')}</th>
                )}
                <th className="px-4 py-3">{t('admin.events.participants.columns.attendance')}</th>
                <th className="px-4 py-3 text-end">
                  {t('admin.events.participants.columns.actions')}
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((participant) => {
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
                        {participantName(participant, i18n.language, t)}
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
                    {mode === 'admin' && (
                      <td className="px-4 py-3 text-slate-500">{participant.user.email}</td>
                    )}
                    <td className="px-4 py-3">
                      <StatusBadge tone={REGISTRATION_STATUS_TONE[participant.status]}>
                        {t(STATUS_LABEL_KEY[participant.status])}
                      </StatusBadge>
                    </td>
                    {mode === 'admin' && (
                      <td className="px-4 py-3 text-slate-500">
                        {new Date(participant.registeredAt).toLocaleDateString()}
                      </td>
                    )}
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
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1.5">
                        {mode === 'admin' && participant.status === 'REGISTERED' && (
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
                        {mode === 'admin' && (
                          <Button
                            type="button"
                            variant="ghost"
                            aria-label={t('admin.events.participants.edit.action')}
                            onClick={() => setEditingParticipant(participant)}
                          >
                            <Pencil size={16} />
                          </Button>
                        )}
                        {canRemove && (
                          <Button
                            type="button"
                            variant="ghost"
                            aria-label={t('admin.events.participants.remove.action')}
                            disabled={removeMutation.isPending}
                            onClick={() => void handleRemove(participant.id)}
                          >
                            <UserMinus size={16} className="text-error" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>
      )}

      {event && (
        <EditParticipantModal
          open={editingParticipant !== null}
          onClose={() => setEditingParticipant(null)}
          event={event}
          participant={editingParticipant}
        />
      )}
    </div>
  )
}
