import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { eventFormSchema, type EventFormValues } from '@/features/admin/events/validation'

interface EventFormProps {
  defaultValues?: Partial<EventFormValues>
  onSubmit: (values: EventFormValues) => Promise<void>
  submitLabel: string
  formError?: string | null
  showStatus?: boolean
}

export function EventForm({
  defaultValues,
  onSubmit,
  submitLabel,
  formError,
  showStatus,
}: EventFormProps) {
  const { t } = useTranslation()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues,
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label={t('admin.events.form.titleFr')}
          error={errors.titleFr && t(errors.titleFr.message ?? 'validation.required')}
          {...register('titleFr')}
        />
        <Input
          label={t('admin.events.form.titleAr')}
          dir="rtl"
          error={errors.titleAr && t(errors.titleAr.message ?? 'validation.required')}
          {...register('titleAr')}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Textarea
          label={t('admin.events.form.descriptionFr')}
          error={errors.descriptionFr && t(errors.descriptionFr.message ?? 'validation.required')}
          {...register('descriptionFr')}
        />
        <Textarea
          label={t('admin.events.form.descriptionAr')}
          dir="rtl"
          error={errors.descriptionAr && t(errors.descriptionAr.message ?? 'validation.required')}
          {...register('descriptionAr')}
        />
      </div>

      <Input
        label={t('admin.events.form.location')}
        error={errors.location && t(errors.location.message ?? 'validation.required')}
        {...register('location')}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          type="datetime-local"
          label={t('admin.events.form.startDate')}
          error={errors.startDate && t(errors.startDate.message ?? 'validation.invalidDate')}
          {...register('startDate')}
        />
        <Input
          type="datetime-local"
          label={t('admin.events.form.endDate')}
          error={errors.endDate && t(errors.endDate.message ?? 'validation.invalidDate')}
          {...register('endDate')}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          type="number"
          min={1}
          label={t('admin.events.form.maxParticipants')}
          error={
            errors.maxParticipants && t(errors.maxParticipants.message ?? 'validation.required')
          }
          {...register('maxParticipants')}
        />
        {showStatus && (
          <Select
            label={t('admin.events.form.status')}
            options={[
              { value: 'ACTIVE', label: t('admin.events.status.ACTIVE') },
              { value: 'CANCELLED', label: t('admin.events.status.CANCELLED') },
            ]}
            {...register('status')}
          />
        )}
      </div>

      {formError && <p className="text-sm text-error">{formError}</p>}

      <Button type="submit" disabled={isSubmitting} loading={isSubmitting}>
        {submitLabel}
      </Button>
    </form>
  )
}
