import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
import { useAdminEvent } from '@/features/admin/events/hooks/useAdminEvents'
import { useEventParticipants } from '@/features/events/hooks/useEvents'
import { ParticipantsTable } from '@/features/events/components/ParticipantsTable'
import { AddParticipantModal } from '@/features/events/components/AddParticipantModal'

export function AdminEventParticipantsPage() {
  const { t, i18n } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const { data: event } = useAdminEvent(id)
  const { data: participants, isLoading, isError } = useEventParticipants(id)
  const [addModalOpen, setAddModalOpen] = useState(false)

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
        {event && (
          <p className="text-sm text-slate-500">
            {i18n.language === 'ar' ? event.titleAr : event.titleFr}
          </p>
        )}
      </div>

      <ParticipantsTable
        mode="admin"
        event={event}
        participants={participants}
        isLoading={isLoading}
        isError={isError}
        onAddParticipant={() => setAddModalOpen(true)}
      />

      {event && (
        <AddParticipantModal
          open={addModalOpen}
          onClose={() => setAddModalOpen(false)}
          event={event}
          participants={participants ?? []}
        />
      )}
    </div>
  )
}
