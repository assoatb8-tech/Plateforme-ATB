import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { EventForm } from '@/features/admin/events/components/EventForm'
import {
  useAdminEvent,
  useCreateEvent,
  useUpdateEvent,
} from '@/features/admin/events/hooks/useAdminEvents'
import { toDatetimeLocalValue, type EventFormValues } from '@/features/admin/events/validation'

export function AdminEventFormPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEditMode = Boolean(id)
  const [formError, setFormError] = useState<string | null>(null)

  const { data: event, isLoading, isError } = useAdminEvent(id)
  const createMutation = useCreateEvent()
  const updateMutation = useUpdateEvent(id ?? '')

  async function onSubmit(values: EventFormValues) {
    setFormError(null)
    try {
      if (isEditMode && id) {
        await updateMutation.mutateAsync(values)
      } else {
        await createMutation.mutateAsync(values)
      }
      navigate('/admin/evenements')
    } catch {
      setFormError(t('admin.events.form.errorGeneric'))
    }
  }

  if (isEditMode && isLoading) {
    return <p className="text-sm text-slate-500">{t('admin.loading')}</p>
  }

  if (isEditMode && (isError || !event)) {
    return <p className="text-sm text-error">{t('events.notFound')}</p>
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          to="/admin/evenements"
          className="mb-2 inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          <ArrowLeft size={16} />
          {t('admin.events.back')}
        </Link>
        <h1 className="text-2xl font-semibold text-slate-900">
          {isEditMode ? t('admin.events.form.editTitle') : t('admin.events.form.createTitle')}
        </h1>
      </div>

      <Card>
        <EventForm
          showStatus={isEditMode}
          formError={formError}
          submitLabel={isEditMode ? t('admin.events.form.save') : t('admin.events.form.submit')}
          defaultValues={
            event
              ? {
                  titleFr: event.titleFr,
                  titleAr: event.titleAr,
                  descriptionFr: event.descriptionFr,
                  descriptionAr: event.descriptionAr,
                  location: event.location,
                  startDate: toDatetimeLocalValue(event.startDate),
                  endDate: toDatetimeLocalValue(event.endDate),
                  maxParticipants: event.maxParticipants,
                  status: event.status,
                }
              : undefined
          }
          onSubmit={onSubmit}
        />
      </Card>
    </div>
  )
}
