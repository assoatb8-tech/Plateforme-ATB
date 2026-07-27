import type { UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Textarea } from '@/components/ui/Textarea'
import type { MemberFormValues } from '@/features/member-form/validation'

export function Step6Experience({ form }: { form: UseFormReturn<MemberFormValues> }) {
  const { t } = useTranslation()
  const { register } = form

  return (
    <div className="flex flex-col gap-4">
      <Textarea
        label={t('memberForm.fields.previousAssociations')}
        {...register('previousAssociations')}
      />
      <Textarea label={t('memberForm.fields.sports')} {...register('sports')} />
    </div>
  )
}
