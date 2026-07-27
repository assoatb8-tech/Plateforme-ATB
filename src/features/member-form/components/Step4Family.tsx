import type { UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import type { MemberFormValues } from '@/features/member-form/validation'

const BLOOD_TYPES = [
  'A_POSITIVE',
  'A_NEGATIVE',
  'B_POSITIVE',
  'B_NEGATIVE',
  'AB_POSITIVE',
  'AB_NEGATIVE',
  'O_POSITIVE',
  'O_NEGATIVE',
] as const

const BLOOD_TYPE_LABELS: Record<(typeof BLOOD_TYPES)[number], string> = {
  A_POSITIVE: 'A+',
  A_NEGATIVE: 'A-',
  B_POSITIVE: 'B+',
  B_NEGATIVE: 'B-',
  AB_POSITIVE: 'AB+',
  AB_NEGATIVE: 'AB-',
  O_POSITIVE: 'O+',
  O_NEGATIVE: 'O-',
}

export function Step4Family({ form }: { form: UseFormReturn<MemberFormValues> }) {
  const { t } = useTranslation()
  const {
    register,
    formState: { errors },
  } = form

  return (
    <div className="flex flex-col gap-4">
      <Select
        label={t('memberForm.fields.maritalStatus')}
        placeholder={t('memberForm.selectPlaceholder')}
        options={[
          { value: 'SINGLE', label: t('memberForm.maritalStatusOptions.single') },
          { value: 'MARRIED', label: t('memberForm.maritalStatusOptions.married') },
          { value: 'DIVORCED', label: t('memberForm.maritalStatusOptions.divorced') },
          { value: 'WIDOWED', label: t('memberForm.maritalStatusOptions.widowed') },
        ]}
        {...register('maritalStatus')}
      />

      <Input
        type="number"
        min={0}
        label={t('memberForm.fields.childrenCount')}
        error={errors.childrenCount && t(errors.childrenCount.message ?? 'validation.required')}
        {...register('childrenCount')}
      />

      <Select
        label={t('memberForm.fields.bloodType')}
        placeholder={t('memberForm.selectPlaceholder')}
        options={BLOOD_TYPES.map((value) => ({ value, label: BLOOD_TYPE_LABELS[value] }))}
        {...register('bloodType')}
      />

      <Input label={t('memberForm.fields.educationLevel')} {...register('educationLevel')} />
    </div>
  )
}
