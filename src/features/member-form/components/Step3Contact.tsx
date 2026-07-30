import type { UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import type { MemberFormValues } from '@/features/member-form/validation'

export function Step3Contact({ form }: { form: UseFormReturn<MemberFormValues> }) {
  const { t } = useTranslation()
  const {
    register,
    formState: { errors },
  } = form

  return (
    <div className="flex flex-col gap-4">
      <Textarea
        required
        label={t('memberForm.fields.address')}
        error={errors.address && t(errors.address.message ?? 'validation.required')}
        {...register('address')}
      />
      <Input
        type="tel"
        label={t('memberForm.fields.phoneHome')}
        error={errors.phoneHome && t(errors.phoneHome.message ?? 'validation.phoneInvalid')}
        {...register('phoneHome')}
      />
      <Input
        type="tel"
        required
        label={t('memberForm.fields.phoneMobile')}
        error={errors.phoneMobile && t(errors.phoneMobile.message ?? 'validation.phoneInvalid')}
        {...register('phoneMobile')}
      />
      <Input
        type="email"
        label={t('memberForm.fields.contactEmail')}
        error={errors.contactEmail && t(errors.contactEmail.message ?? 'validation.emailInvalid')}
        {...register('contactEmail')}
      />
    </div>
  )
}
