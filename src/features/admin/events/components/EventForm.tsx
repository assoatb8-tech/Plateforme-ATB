import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { ShadowDotsLoader } from '@/components/ui/ShadowDotsLoader'
import { eventFormSchema, type EventFormValues } from '@/features/admin/events/validation'
import { uploadEventBanner } from '@/features/admin/events/services/adminEventsService'
import { PhotoDecodeError } from '@/services/storageService'
import { loadFormDraft, useAutosaveFormDraft } from '@/hooks/useFormDraft'

interface EventFormProps {
  defaultValues?: Partial<EventFormValues>
  onSubmit: (values: EventFormValues) => Promise<void>
  submitLabel: string
  formError?: string | null
  showStatus?: boolean
  // Only passed for the "create" route — a mobile tab reload while an
  // admin is mid-way through a new event shouldn't lose their typing (see
  // src/hooks/useFormDraft.ts). Edit mode already has real server values
  // and has no business overwriting them with a stale local draft.
  draftKey?: string
}

export function EventForm({
  defaultValues,
  onSubmit,
  submitLabel,
  formError,
  showStatus,
  draftKey,
}: EventFormProps) {
  const { t } = useTranslation()
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: draftKey
      ? { ...defaultValues, ...loadFormDraft<EventFormValues>(draftKey) }
      : defaultValues,
  })

  useAutosaveFormDraft(draftKey ?? 'unused', watch, Boolean(draftKey))

  const bannerUrl = watch('bannerUrl')
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [bannerError, setBannerError] = useState<string | null>(null)

  async function handleBannerChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setBannerError(null)
    setUploadingBanner(true)
    try {
      const url = await uploadEventBanner(file)
      setValue('bannerUrl', url, { shouldValidate: true, shouldDirty: true })
    } catch (error) {
      setBannerError(
        t(
          error instanceof PhotoDecodeError
            ? 'profile.photoDecodeError'
            : 'profile.photoUploadError',
        ),
      )
    } finally {
      setUploadingBanner(false)
    }
  }

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

      <Input
        type="url"
        label={t('admin.events.form.facebookPostUrl')}
        placeholder="https://facebook.com/..."
        error={
          errors.facebookPostUrl && t(errors.facebookPostUrl.message ?? 'validation.invalidUrl')
        }
        {...register('facebookPostUrl')}
      />

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-slate-700">
          {t('admin.events.form.banner')}
        </label>
        <div className="flex items-center gap-4">
          {bannerUrl ? (
            <img src={bannerUrl} alt="" className="h-16 w-28 shrink-0 rounded-lg object-cover" />
          ) : (
            <div className="h-16 w-28 shrink-0 rounded-lg bg-slate-100" aria-hidden="true" />
          )}
          <div className="flex flex-col gap-1">
            <input
              type="file"
              accept="image/*"
              onChange={(event) => void handleBannerChange(event)}
              disabled={uploadingBanner}
              className="text-sm text-slate-600 file:me-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary hover:file:bg-primary/20"
            />
            {uploadingBanner && (
              <p className="flex items-center gap-2 text-sm text-slate-500">
                <ShadowDotsLoader />
                {t('profile.photoUploading')}
              </p>
            )}
            {bannerError && <p className="text-sm text-error">{bannerError}</p>}
          </div>
        </div>
      </div>

      {formError && <p className="text-sm text-error">{formError}</p>}

      <Button type="submit" disabled={isSubmitting} loading={isSubmitting}>
        {submitLabel}
      </Button>
    </form>
  )
}
