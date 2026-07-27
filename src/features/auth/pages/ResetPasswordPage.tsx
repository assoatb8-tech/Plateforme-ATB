import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { resetPasswordSchema, type ResetPasswordFormValues } from '@/features/auth/validation'
import { updatePassword } from '@/features/auth/services/authService'

export function ResetPasswordPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({ resolver: zodResolver(resetPasswordSchema) })

  async function onSubmit(values: ResetPasswordFormValues) {
    setFormError(null)
    try {
      await updatePassword(values.password)
      navigate('/')
    } catch {
      setFormError(t('auth.resetPassword.errorGeneric'))
    }
  }

  return (
    <Card>
      <h1 className="text-2xl font-semibold text-slate-900">{t('auth.resetPassword.title')}</h1>
      <p className="mt-1 text-sm text-slate-500">{t('auth.resetPassword.subtitle')}</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4" noValidate>
        <Input
          type="password"
          autoComplete="new-password"
          label={t('auth.resetPassword.passwordLabel')}
          error={errors.password && t(errors.password.message ?? 'validation.required')}
          {...register('password')}
        />
        <Input
          type="password"
          autoComplete="new-password"
          label={t('auth.resetPassword.confirmPasswordLabel')}
          error={
            errors.confirmPassword && t(errors.confirmPassword.message ?? 'validation.required')
          }
          {...register('confirmPassword')}
        />

        {formError && <p className="text-sm text-error">{formError}</p>}

        <Button type="submit" disabled={isSubmitting}>
          {t('auth.resetPassword.submit')}
        </Button>
      </form>
    </Card>
  )
}
