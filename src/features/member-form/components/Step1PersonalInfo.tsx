import type { UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import type { MemberFormValues } from '@/features/member-form/validation'

export function Step1PersonalInfo({ form }: { form: UseFormReturn<MemberFormValues> }) {
  const { t } = useTranslation()
  const {
    register,
    formState: { errors },
  } = form

  return (
    <div className="flex flex-col gap-4">
      <Input
        label={t('memberForm.fields.fullName')}
        error={errors.fullName && t(errors.fullName.message ?? 'validation.required')}
        {...register('fullName')}
      />

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
