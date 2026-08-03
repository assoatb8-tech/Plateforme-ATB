import { useEffect, useState } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { ShadowDotsLoader } from '@/components/ui/ShadowDotsLoader'
import { useAuth } from '@/features/auth/hooks/useAuth'
import type { MemberFormValues } from '@/features/member-form/validation'
import {
  getSignedProfilePhotoUrl,
  uploadProfilePhoto,
  validateProfilePhotoFile,
} from '@/services/storageService'

export function Step1PersonalInfo({ form }: { form: UseFormReturn<MemberFormValues> }) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const {
    register,
    setValue,
    formState: { errors },
  } = form
  const currentPhotoPath = form.watch('photoUrl')

  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    if (currentPhotoPath) {
      void getSignedProfilePhotoUrl(currentPhotoPath).then((url) => {
        if (!cancelled) setPreviewUrl(url)
      })
    } else {
      setPreviewUrl(null)
    }
    return () => {
      cancelled = true
    }
  }, [currentPhotoPath])

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file || !user) return

    const validationError = validateProfilePhotoFile(file)
    if (validationError) {
      setUploadError(t(validationError))
      return
    }

    setUploadError(null)
    setUploading(true)
    try {
      const path = await uploadProfilePhoto(user.id, file)
      setValue('photoUrl', path, { shouldValidate: true, shouldDirty: true })
    } catch {
      setUploadError(t('profile.photoUploadError'))
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-slate-700">
          {t('memberForm.fields.photo')}
          <span className="text-error" aria-hidden="true">
            {' '}
            *
          </span>
        </label>
        <div className="flex items-center gap-4">
          {previewUrl ? (
            <img src={previewUrl} alt="" className="h-16 w-16 shrink-0 rounded-full object-cover" />
          ) : (
            <div className="h-16 w-16 shrink-0 rounded-full bg-slate-100" aria-hidden="true" />
          )}
          <div className="flex flex-col gap-1">
            <input
              type="file"
              accept="image/jpeg,image/png"
              onChange={(event) => void handleFileChange(event)}
              disabled={uploading}
              className="text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary hover:file:bg-primary/20"
            />
            {uploading && (
              <p className="flex items-center gap-2 text-sm text-slate-500">
                <ShadowDotsLoader />
                {t('profile.photoUploading')}
              </p>
            )}
            {uploadError && <p className="text-sm text-error">{uploadError}</p>}
            {!uploading && errors.photoUrl && (
              <p className="text-sm text-error">
                {t(errors.photoUrl.message ?? 'validation.required')}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          required
          label={t('memberForm.fields.firstNameFr')}
          error={errors.firstNameFr && t(errors.firstNameFr.message ?? 'validation.required')}
          {...register('firstNameFr')}
        />
        <Input
          required
          label={t('memberForm.fields.lastNameFr')}
          error={errors.lastNameFr && t(errors.lastNameFr.message ?? 'validation.required')}
          {...register('lastNameFr')}
        />
        <Input
          required
          dir="rtl"
          label={t('memberForm.fields.firstNameAr')}
          error={errors.firstNameAr && t(errors.firstNameAr.message ?? 'validation.required')}
          {...register('firstNameAr')}
        />
        <Input
          required
          dir="rtl"
          label={t('memberForm.fields.lastNameAr')}
          error={errors.lastNameAr && t(errors.lastNameAr.message ?? 'validation.required')}
          {...register('lastNameAr')}
        />
      </div>

      <Select
        label={t('memberForm.fields.gender')}
        placeholder={t('memberForm.selectPlaceholder')}
        options={[
          { value: 'MALE', label: t('memberForm.genderOptions.male') },
          { value: 'FEMALE', label: t('memberForm.genderOptions.female') },
        ]}
        {...register('gender')}
      />

      <Input label={t('memberForm.fields.fatherName')} {...register('fatherName')} />
      <Input label={t('memberForm.fields.grandfatherName')} {...register('grandfatherName')} />
      <Input label={t('memberForm.fields.motherFullName')} {...register('motherFullName')} />
    </div>
  )
}
