import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Checkbox } from '@/components/ui/Checkbox'
import { useEditParticipant } from '@/features/events/hooks/useEvents'
import { resolveMemberDisplayName } from '@/utils/displayName'
import type { EventDto, EventParticipantDto, RegistrationStatus } from '@/features/events/types'

interface EditParticipantModalProps {
  open: boolean
  onClose: () => void
  event: EventDto
  participant: EventParticipantDto | null
}

// ADMIN only — corrects a participant's status (e.g. manually promoting
// them off the waiting list) and/or, for a multi-day event, which day(s)
// they're down for. Cancelling isn't offered here — that's the separate
// "remove" action, available to the leader too.
export function EditParticipantModal({
  open,
  onClose,
  event,
  participant,
}: EditParticipantModalProps) {
  const { t, i18n } = useTranslation()
  const [status, setStatus] = useState<RegistrationStatus>('REGISTERED')
  const [dayIds, setDayIds] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const editMutation = useEditParticipant(event.id)

  // Re-seed local state whenever a different participant is opened for
  // editing (or the modal reopens on the same one after a change).
  useEffect(() => {
    if (!participant) return
    setStatus(participant.status === 'WAITING_LIST' ? 'WAITING_LIST' : 'REGISTERED')
    setDayIds(participant.daySelections.map((selection) => selection.eventDay.id))
    setError(null)
  }, [participant])

  function toggleDay(dayId: string) {
    setDayIds((prev) =>
      prev.includes(dayId) ? prev.filter((id) => id !== dayId) : [...prev, dayId],
    )
  }

  async function handleSubmit() {
    if (!participant) return
    if (event.isMultiDay && dayIds.length === 0) {
      setError(t('admin.events.participants.add.daysRequiredError'))
      return
    }
    setError(null)
    try {
      await editMutation.mutateAsync({
        registrationId: participant.id,
        status: status !== participant.status ? status : undefined,
        dayIds: event.isMultiDay ? dayIds : undefined,
      })
      onClose()
    } catch {
      setError(t('admin.events.participants.edit.error'))
    }
  }

  if (!participant) return null

  const name =
    (participant.user.memberProfile &&
      resolveMemberDisplayName(participant.user.memberProfile, i18n.language)) ||
    t('admin.users.noName')

  return (
    <Modal open={open} onClose={onClose} title={t('admin.events.participants.edit.title')}>
      <div className="flex flex-col gap-4">
        <p className="text-sm font-medium text-slate-800">{name}</p>

        <Select
          label={t('admin.events.participants.edit.statusLabel')}
          value={status}
          onChange={(event_) => setStatus(event_.target.value as RegistrationStatus)}
          options={[
            { value: 'REGISTERED', label: t('events.status.registered') },
            { value: 'WAITING_LIST', label: t('events.status.waitingList') },
          ]}
        />

        {event.isMultiDay && (
          <div className="flex flex-col gap-2 rounded-lg border border-slate-200 p-3">
            <p className="text-sm font-medium text-slate-700">
              {t('admin.events.participants.add.pickDays')}
            </p>
            {event.days.map((day) => (
              <Checkbox
                key={day.id}
                label={new Date(day.startAt).toLocaleDateString(
                  i18n.language === 'ar' ? 'ar-TN' : 'fr-TN',
                  { day: 'numeric', month: 'long', timeZone: 'Africa/Tunis' },
                )}
                checked={dayIds.includes(day.id)}
                onChange={() => toggleDay(day.id)}
              />
            ))}
          </div>
        )}

        {error && <p className="text-sm text-error">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            {t('admin.events.deleteCancel')}
          </Button>
          <Button
            type="button"
            disabled={editMutation.isPending}
            loading={editMutation.isPending}
            onClick={() => void handleSubmit()}
          >
            {t('admin.events.participants.edit.submit')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
