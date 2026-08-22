import { useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { Plus, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
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

const EMPTY_DAY = { date: '', startTime: '', endTime: '' }

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
    control,
    formState: { errors, isSubmitting },
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: draftKey
      ? { ...defaultValues, ...loadFormDraft<EventFormValues>(draftKey) }
      : defaultValues,
  })

  useAutosaveFormDraft(draftKey ?? 'unused', watch, Boolean(draftKey))

  const { fields, append, remove } = useFieldArray({ control, name: 'days' })

  const isMultiDay = watch('isMultiDay')
  // UI-only convenience, not part of the validated schema — reduces
  // filling the same start/end time on every single day row.
  const [sameTime, setSameTime] = useState(true)
  const [sharedStartTime, setSharedStartTime] = useState('')
  const [sharedEndTime, setSharedEndTime] = useState('')

  function applySharedTime(startTime: string, endTime: string) {
    setSharedStartTime(startTime)
    setSharedEndTime(endTime)
    fields.forEach((_field, index) => {
      setValue(`days.${index}.startTime`, startTime, { shouldValidate: true })
      setValue(`days.${index}.endTime`, endTime, { shouldValidate: true })
    })
  }

  function handleAddDay() {
    append(
      sameTime ? { ...EMPTY_DAY, startTime: sharedStartTime, endTime: sharedEndTime } : EMPTY_DAY,
    )
  }

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

      <Checkbox label={t('admin.events.form.isMultiDay')} {...register('isMultiDay')} />

      {!isMultiDay && (
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
      )}

      {isMultiDay && (
        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4">
          <Checkbox
            label={t('admin.events.form.sameTimeEachDay')}
            checked={sameTime}
            onChange={(event) => setSameTime(event.target.checked)}
          />

          {sameTime && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                type="time"
                id="sharedStartTime"
                label={t('admin.events.form.startTime')}
                value={sharedStartTime}
                onChange={(event) => applySharedTime(event.target.value, sharedEndTime)}
              />
              <Input
                type="time"
                id="sharedEndTime"
                label={t('admin.events.form.endTime')}
                value={sharedEndTime}
                onChange={(event) => applySharedTime(sharedStartTime, event.target.value)}
              />
            </div>
          )}

          {errors.days?.message && <p className="text-sm text-error">{t(errors.days.message)}</p>}

          <div className="flex flex-col gap-3">
            {fields.map((field, index) => {
              const dayErrors = errors.days?.[index]
              return (
                <div
                  key={field.id}
                  className="flex flex-col gap-3 rounded-lg bg-slate-50 p-3 sm:flex-row sm:items-end"
                >
                  <div className="flex-1">
                    <Input
                      type="date"
                      label={t('admin.events.form.dayDate', { number: index + 1 })}
                      error={dayErrors?.date && t(dayErrors.date.message ?? 'validation.required')}
                      {...register(`days.${index}.date`)}
                    />
                  </div>
                  {!sameTime && (
                    <>
                      <div className="flex-1">
                        <Input
                          type="time"
                          label={t('admin.events.form.startTime')}
                          error={
                            dayErrors?.startTime &&
                            t(dayErrors.startTime.message ?? 'validation.required')
                          }
                          {...register(`days.${index}.startTime`)}
                        />
                      </div>
                      <div className="flex-1">
                        <Input
                          type="time"
                          label={t('admin.events.form.endTime')}
                          error={
                            dayErrors?.endTime &&
                            t(dayErrors.endTime.message ?? 'validation.required')
                          }
                          {...register(`days.${index}.endTime`)}
                        />
                      </div>
                    </>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={fields.length <= 1}
                    onClick={() => remove(index)}
                    aria-label={t('admin.events.form.removeDay')}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              )
            })}
          </div>

          <Button type="button" variant="secondary" onClick={handleAddDay} className="w-fit">
            <Plus size={16} />
            {t('admin.events.form.addDay')}
          </Button>
        </div>
      )}

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
