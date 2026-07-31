import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { registerSchema, type RegisterFormValues } from '@/features/auth/validation'
import { signUp } from '@/features/auth/services/authService'

export function RegisterPage() {
  const { t } = useTranslation()
  const [formError, setFormError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) })

  async function onSubmit(values: RegisterFormValues) {
    setFormError(null)
    try {
      await signUp(values.email, values.password)
      setSuccess(true)
    } catch {
      setFormError(t('auth.register.errorGeneric'))
    }
  }

  if (success) {
    return (
      <Card className="text-center">
        <h1 className="text-2xl font-semibold text-slate-900">{t('auth.register.title')}</h1>
        <p className="mt-4 text-sm text-slate-600">{t('auth.register.success')}</p>
        <Link
          to="/connexion"
          className="mt-6 inline-block text-sm font-medium text-primary hover:underline"
        >
          {t('auth.login.title')}
        </Link>
      </Card>
    )
  }

  return (
    <Card>
      <h1 className="text-2xl font-semibold text-slate-900">{t('auth.register.title')}</h1>
      <p className="mt-1 text-sm text-slate-500">{t('auth.register.subtitle')}</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4" noValidate>
        <Input
          type="email"
          autoComplete="email"
          required
          label={t('auth.register.emailLabel')}
          error={errors.email && t(errors.email.message ?? 'validation.required')}
          {...register('email')}
        />
        <Input
          type="password"
          autoComplete="new-password"
          required
          label={t('auth.register.passwordLabel')}
          error={errors.password && t(errors.password.message ?? 'validation.required')}
          {...register('password')}
        />
        <Input
          type="password"
          autoComplete="new-password"
          required
          label={t('auth.register.confirmPasswordLabel')}
          error={
            errors.confirmPassword && t(errors.confirmPassword.message ?? 'validation.required')
          }
          {...register('confirmPassword')}
        />

        {formError && <p className="text-sm text-error">{formError}</p>}

        <Button type="submit" disabled={isSubmitting} loading={isSubmitting}>
          {t('auth.register.submit')}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        {t('auth.register.hasAccount')}{' '}
        <Link to="/connexion" className="font-medium text-primary hover:underline">
          {t('auth.register.loginLink')}
        </Link>
      </p>
    </Card>
  )
}
