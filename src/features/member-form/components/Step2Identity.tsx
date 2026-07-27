import type { UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/Input'
import type { MemberFormValues } from '@/features/member-form/validation'

export function Step2Identity({ form }: { form: UseFormReturn<MemberFormValues> }) {
  const { t } = useTranslation()
  const {
    register,
    formState: { errors },
  } = form

  return (
    <div className="flex flex-col gap-4">
      <Input
        type="date"
        label={t('memberForm.fields.birthDate')}
        error={errors.birthDate && t(errors.birthDate.message ?? 'validation.invalidDate')}
        {...register('birthDate')}
      />
      <Input label={t('memberForm.fields.birthPlace')} {...register('birthPlace')} />
      <Input
        label={t('memberForm.fields.cinNumber')}
        inputMode="numeric"
        maxLength={8}
        error={errors.cinNumber && t(errors.cinNumber.message ?? 'validation.cinInvalid')}
        {...register('cinNumber')}
      />
      <Input label={t('memberForm.fields.cinIssuedPlace')} {...register('cinIssuedPlace')} />
      <Input
        type="date"
        label={t('memberForm.fields.cinIssueDate')}
        error={errors.cinIssueDate && t(errors.cinIssueDate.message ?? 'validation.invalidDate')}
        {...register('cinIssueDate')}
      />
    </div>
  )
}
