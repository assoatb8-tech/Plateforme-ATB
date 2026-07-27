import type { UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/Input'
import { Checkbox } from '@/components/ui/Checkbox'
import type { MemberFormValues } from '@/features/member-form/validation'

export function Step8Declaration({ form }: { form: UseFormReturn<MemberFormValues> }) {
  const { t } = useTranslation()
  const {
    register,
    formState: { errors },
  } = form

  return (
    <div className="flex flex-col gap-4">
      <Checkbox
        label={t('memberForm.declaration.text')}
        error={
          errors.declarationAccepted &&
          t(errors.declarationAccepted.message ?? 'validation.declarationRequired')
        }
        {...register('declarationAccepted')}
      />

      <Input label={t('memberForm.fields.declarationPlace')} {...register('declarationPlace')} />
      <Input
        type="date"
        label={t('memberForm.fields.signatureDate')}
        {...register('signatureDate')}
      />
      <Input label={t('memberForm.fields.signature')} {...register('signature')} />
    </div>
  )
}
