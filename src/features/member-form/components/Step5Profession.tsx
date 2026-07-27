import type { UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import type { MemberFormValues } from '@/features/member-form/validation'

export function Step5Profession({ form }: { form: UseFormReturn<MemberFormValues> }) {
  const { t } = useTranslation()
  const {
    register,
    formState: { errors },
  } = form

  return (
    <div className="flex flex-col gap-4">
      <Input label={t('memberForm.fields.profession')} {...register('profession')} />
      <Input label={t('memberForm.fields.speciality')} {...register('speciality')} />
      <Input label={t('memberForm.fields.employer')} {...register('employer')} />
      <Textarea label={t('memberForm.fields.employerAddress')} {...register('employerAddress')} />
      <Input
        type="tel"
        label={t('memberForm.fields.employerPhone')}
        error={errors.employerPhone && t(errors.employerPhone.message ?? 'validation.phoneInvalid')}
        {...register('employerPhone')}
      />
      <Input label={t('memberForm.fields.workFax')} {...register('workFax')} />
    </div>
  )
}
