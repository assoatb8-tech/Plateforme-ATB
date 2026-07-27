import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import {
  memberFormSchema,
  stepLabelKeys,
  type MemberFormValues,
} from '@/features/member-form/validation'
import {
  getMemberProfile,
  profileToFormValues,
  updateMemberProfile,
} from '@/features/member-form/services/profileService'
import { Step1PersonalInfo } from '@/features/member-form/components/Step1PersonalInfo'
import { Step2Identity } from '@/features/member-form/components/Step2Identity'
import { Step3Contact } from '@/features/member-form/components/Step3Contact'
import { Step4Family } from '@/features/member-form/components/Step4Family'
import { Step5Profession } from '@/features/member-form/components/Step5Profession'
import { Step6Experience } from '@/features/member-form/components/Step6Experience'
import { Step7Documents } from '@/features/member-form/components/Step7Documents'
import { Step8Declaration } from '@/features/member-form/components/Step8Declaration'

// Same 8 sections as MemberFormPage's wizard, rendered as one scrollable
// page instead — editing an existing profile doesn't need step-by-step
// gating, but reuses the exact same field components and Zod schema so
// validation never drifts between "create" and "edit".
const STEP_COMPONENTS = [
  Step1PersonalInfo,
  Step2Identity,
  Step3Contact,
  Step4Family,
  Step5Profession,
  Step6Experience,
  Step7Documents,
  Step8Declaration,
]

export function ProfilePage() {
  const { t } = useTranslation()
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const {
    data: profile,
    isLoading,
    isError,
  } = useQuery({ queryKey: ['profile'], queryFn: getMemberProfile })

  const form = useForm<MemberFormValues>({
    resolver: zodResolver(memberFormSchema),
  })

  useEffect(() => {
    if (profile) {
      form.reset(profileToFormValues(profile))
    }
    // form is stable across renders (react-hook-form) — only re-sync when
    // the fetched profile itself changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile])

  async function onSubmit(values: MemberFormValues) {
    setSaveError(null)
    setSaveSuccess(false)
    try {
      await updateMemberProfile(values)
      setSaveSuccess(true)
    } catch {
      setSaveError(t('profile.errorGeneric'))
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center text-sm text-slate-500">
        {t('dashboard.loading')}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center text-sm text-error">
        {t('profile.errorGeneric')}
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <Card className="flex flex-col items-center gap-4">
          <p className="text-sm text-slate-600">{t('profile.noProfileYet')}</p>
          <Link to="/dossier-adhesion">
            <Button type="button">{t('dashboard.completeProfileCta')}</Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">{t('profile.title')}</h1>

      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
        {STEP_COMPONENTS.map((StepComponent, index) => (
          <Card key={stepLabelKeys[index]} className="flex flex-col gap-4">
            <h2 className="text-base font-semibold text-slate-800">
              {t(`memberForm.steps.${stepLabelKeys[index]}`)}
            </h2>
            <StepComponent form={form} />
          </Card>
        ))}

        {saveError && <p className="text-sm text-error">{saveError}</p>}
        {saveSuccess && <p className="text-sm text-success">{t('profile.saveSuccess')}</p>}

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {t('profile.save')}
        </Button>
      </form>
    </div>
  )
}
