import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { loginSchema, type LoginFormValues } from '@/features/auth/validation'
import { signIn } from '@/features/auth/services/authService'

export function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) })

  async function onSubmit(values: LoginFormValues) {
    setFormError(null)
    try {
      await signIn(values.email, values.password)
      navigate('/')
    } catch {
      setFormError(t('auth.login.errorInvalidCredentials'))
    }
  }

  return (
    <Card>
      <h1 className="text-2xl font-semibold text-slate-900">{t('auth.login.title')}</h1>
      <p className="mt-1 text-sm text-slate-500">{t('auth.login.subtitle')}</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4" noValidate>
        <Input
          type="email"
          autoComplete="email"
          label={t('auth.login.emailLabel')}
          error={errors.email && t(errors.email.message ?? 'validation.required')}
          {...register('email')}
        />
        <Input
          type="password"
          autoComplete="current-password"
          label={t('auth.login.passwordLabel')}
          error={errors.password && t(errors.password.message ?? 'validation.required')}
          {...register('password')}
        />

        {formError && <p className="text-sm text-error">{formError}</p>}

        <Button type="submit" disabled={isSubmitting}>
          {t('auth.login.submit')}
        </Button>
      </form>

      <div className="mt-6 flex flex-col items-center gap-2 text-sm">
        <Link to="/mot-de-passe-oublie" className="text-primary hover:underline">
          {t('auth.login.forgotPassword')}
        </Link>
        <p className="text-slate-500">
          {t('auth.login.noAccount')}{' '}
          <Link to="/inscription" className="font-medium text-primary hover:underline">
            {t('auth.login.registerLink')}
          </Link>
        </p>
      </div>
    </Card>
  )
}
