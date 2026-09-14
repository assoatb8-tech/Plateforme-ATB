import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, UserRound } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { useAdminUsersList } from '@/features/admin/users/hooks/useAdminUsers'
import { useAddParticipant } from '@/features/events/hooks/useEvents'
import { useSignedPhotoUrls } from '@/hooks/useSignedPhotoUrls'
import { resolveMemberDisplayName } from '@/utils/displayName'
import type { EventDto, EventParticipantDto } from '@/features/events/types'

interface AddParticipantModalProps {
  open: boolean
  onClose: () => void
  event: EventDto
  participants: EventParticipantDto[]
}

// ADMIN only — searches existing members (same picker pattern as the
// Bureau member picker) and registers the chosen one on the event's
// behalf, prompting for a day selection first when the event is
// multi-day. Deliberately excludes anyone already REGISTERED/WAITING_LIST
// from the results — re-picking them would just bounce off the server's
// 409, better to not offer it in the first place.
export function AddParticipantModal({
  open,
  onClose,
  event,
  participants,
}: AddParticipantModalProps) {
  const { t, i18n } = useTranslation()
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [selectedMember, setSelectedMember] = useState<{ id: string; label: string } | null>(null)
  const [dayIds, setDayIds] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const { data: results, isFetching } = useAdminUsersList(1, search, '')
  const activeUserIds = new Set(
    participants.filter((p) => p.status !== 'CANCELLED').map((p) => p.user.id),
  )
  const candidates = (results?.users ?? []).filter((candidate) => !activeUserIds.has(candidate.id))
  const photoUrls = useSignedPhotoUrls(candidates.map((candidate) => candidate.photoUrl))

  const addMutation = useAddParticipant(event.id)

  function runSearch() {
    setSearch(searchInput.trim())
  }

  function toggleDay(dayId: string) {
    setDayIds((prev) =>
      prev.includes(dayId) ? prev.filter((id) => id !== dayId) : [...prev, dayId],
    )
  }

  function reset() {
    setSearchInput('')
    setSearch('')
    setSelectedMember(null)
    setDayIds([])
    setError(null)
  }

  function handleClose() {
    reset()
    onClose()
  }

  async function handleSubmit() {
    if (!selectedMember) return
    if (event.isMultiDay && dayIds.length === 0) {
      setError(t('admin.events.participants.add.daysRequiredError'))
      return
    }
    setError(null)
    try {
      await addMutation.mutateAsync({
        userId: selectedMember.id,
        dayIds: event.isMultiDay ? dayIds : undefined,
      })
      handleClose()
    } catch {
      setError(t('admin.events.participants.add.error'))
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title={t('admin.events.participants.add.title')}>
      <div className="flex flex-col gap-4">
        {selectedMember ? (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2">
            <p className="text-sm font-medium text-slate-800">{selectedMember.label}</p>
            <Button type="button" variant="ghost" onClick={() => setSelectedMember(null)}>
              {t('admin.bureau.create.changeSelection')}
            </Button>
          </div>
        ) : (
          <>
            <div className="flex gap-2">
              <Input
                type="search"
                placeholder={t('admin.bureau.create.searchPlaceholder')}
                value={searchInput}
                onChange={(event_) => setSearchInput(event_.target.value)}
                onKeyDown={(event_) => {
                  if (event_.key === 'Enter') {
                    event_.preventDefault()
                    runSearch()
                  }
                }}
                aria-label={t('admin.bureau.create.searchPlaceholder')}
                className="min-w-0 flex-1"
              />
              <Button type="button" variant="secondary" className="shrink-0" onClick={runSearch}>
                <Search size={16} />
              </Button>
            </div>
            <div className="flex max-h-48 flex-col gap-1 overflow-y-auto">
              {isFetching && <p className="p-2 text-sm text-slate-500">{t('admin.loading')}</p>}
              {!isFetching && candidates.length === 0 && (
                <p className="p-2 text-sm text-slate-500">{t('admin.bureau.create.noResults')}</p>
              )}
              {candidates.map((candidate) => (
                <button
                  key={candidate.id}
                  type="button"
                  onClick={() =>
                    setSelectedMember({
                      id: candidate.id,
                      label: resolveMemberDisplayName(candidate, i18n.language) || candidate.email,
                    })
                  }
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-start hover:bg-slate-50"
                >
                  {candidate.photoUrl && photoUrls[candidate.photoUrl] ? (
                    <img
                      src={photoUrls[candidate.photoUrl]}
                      alt=""
                      className="h-8 w-8 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-300">
                      <UserRound size={16} />
                    </span>
                  )}
                  <span className="flex flex-col items-start">
                    <span className="text-sm font-medium text-slate-800">
                      {resolveMemberDisplayName(candidate, i18n.language) || candidate.email}
                    </span>
                    <span className="text-xs text-slate-500">{candidate.email}</span>
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        {event.isMultiDay && selectedMember && (
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
          <Button type="button" variant="ghost" onClick={handleClose}>
            {t('admin.events.deleteCancel')}
          </Button>
          <Button
            type="button"
            disabled={!selectedMember || addMutation.isPending}
            loading={addMutation.isPending}
            onClick={() => void handleSubmit()}
          >
            {t('admin.events.participants.add.submit')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
