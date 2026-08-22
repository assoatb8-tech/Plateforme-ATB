import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { SkeletonRows } from '@/components/ui/SkeletonRows'
import { EventForm } from '@/features/admin/events/components/EventForm'
import {
  useAdminEvent,
  useCreateEvent,
  useUpdateEvent,
} from '@/features/admin/events/hooks/useAdminEvents'
import {
  toDatetimeLocalValue,
  toDateAndTimeValues,
  toEventSubmitPayload,
  type EventFormValues,
} from '@/features/admin/events/validation'
import { clearFormDraft } from '@/hooks/useFormDraft'

const CREATE_DRAFT_KEY = 'atb.admin-event-create.draft'

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
      const payload = toEventSubmitPayload(values)
      if (isEditMode && id) {
        await updateMutation.mutateAsync(payload)
      } else {
        await createMutation.mutateAsync(payload)
        clearFormDraft(CREATE_DRAFT_KEY)
      }
      navigate('/admin/evenements')
    } catch {
      setFormError(t('admin.events.form.errorGeneric'))
    }
  }

  if (isEditMode && isLoading) {
    return <SkeletonRows count={6} className="flex flex-col gap-4" />
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
          <ArrowLeft size={16} className="rtl:-scale-x-100" />
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
          draftKey={isEditMode ? undefined : CREATE_DRAFT_KEY}
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
                  facebookPostUrl: event.facebookPostUrl ?? '',
                  bannerUrl: event.bannerUrl ?? '',
                  isMultiDay: event.isMultiDay,
                  days: event.days.map((day) => {
                    const { date, time: startTime } = toDateAndTimeValues(day.startAt)
                    const { time: endTime } = toDateAndTimeValues(day.endAt)
                    return { id: day.id, date, startTime, endTime }
                  }),
                }
              : undefined
          }
          onSubmit={onSubmit}
        />
      </Card>
    </div>
  )
}
