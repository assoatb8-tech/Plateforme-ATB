import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { forgotPasswordSchema, type ForgotPasswordFormValues } from '@/features/auth/validation'
import { requestPasswordReset } from '@/features/auth/services/authService'

export function ForgotPasswordPage() {
  const { t } = useTranslation()
  const [formError, setFormError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({ resolver: zodResolver(forgotPasswordSchema) })

  async function onSubmit(values: ForgotPasswordFormValues) {
    setFormError(null)
    try {
      await requestPasswordReset(values.email)
      setSuccess(true)
    } catch {
      setFormError(t('auth.forgotPassword.errorGeneric'))
    }
  }

  if (success) {
    return (
      <Card className="text-center">
        <h1 className="text-2xl font-semibold text-slate-900">{t('auth.forgotPassword.title')}</h1>
        <p className="mt-4 text-sm text-slate-600">{t('auth.forgotPassword.success')}</p>
        <Link
          to="/connexion"
          className="mt-6 inline-block text-sm font-medium text-primary hover:underline"
        >
          {t('auth.forgotPassword.backToLogin')}
        </Link>
      </Card>
    )
  }

  return (
    <Card>
      <h1 className="text-2xl font-semibold text-slate-900">{t('auth.forgotPassword.title')}</h1>
      <p className="mt-1 text-sm text-slate-500">{t('auth.forgotPassword.subtitle')}</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4" noValidate>
        <Input
          type="email"
          autoComplete="email"
          label={t('auth.forgotPassword.emailLabel')}
          error={errors.email && t(errors.email.message ?? 'validation.required')}
          {...register('email')}
        />

        {formError && <p className="text-sm text-error">{formError}</p>}

        <Button type="submit" disabled={isSubmitting}>
          {t('auth.forgotPassword.submit')}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm">
        <Link to="/connexion" className="font-medium text-primary hover:underline">
          {t('auth.forgotPassword.backToLogin')}
        </Link>
      </p>
    </Card>
  )
}
