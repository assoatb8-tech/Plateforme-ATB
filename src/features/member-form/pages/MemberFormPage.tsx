import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import {
  memberFormSchema,
  memberFormDefaultValues,
  stepFields,
  TOTAL_STEPS,
  type MemberFormValues,
} from '@/features/member-form/validation'
import {
  loadDraft,
  loadDraftStep,
  saveDraftStep,
  clearDraft,
  useAutosaveDraft,
} from '@/features/member-form/hooks/useMemberFormDraft'
import { StepIndicator } from '@/features/member-form/components/StepIndicator'
import { Step1PersonalInfo } from '@/features/member-form/components/Step1PersonalInfo'
import { Step2Identity } from '@/features/member-form/components/Step2Identity'
import { Step3Contact } from '@/features/member-form/components/Step3Contact'
import { Step4Family } from '@/features/member-form/components/Step4Family'
import { Step5Profession } from '@/features/member-form/components/Step5Profession'
import { Step6Experience } from '@/features/member-form/components/Step6Experience'
import { Step7Documents } from '@/features/member-form/components/Step7Documents'
import { Step8Declaration } from '@/features/member-form/components/Step8Declaration'
import { submitMemberProfile } from '@/features/member-form/services/profileService'

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

const STEP_LABEL_KEYS = [
  'personalInfo',
  'identity',
  'contact',
  'family',
  'profession',
  'experience',
  'documents',
  'declaration',
]

export function MemberFormPage() {
  const { t } = useTranslation()
  const [step, setStep] = useState(loadDraftStep)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const form = useForm<MemberFormValues>({
    resolver: zodResolver(memberFormSchema),
    defaultValues: { ...memberFormDefaultValues, ...loadDraft() },
  })

  useAutosaveDraft(form.watch)

  const StepComponent = STEP_COMPONENTS[step - 1]

  async function goNext() {
    const fields = stepFields[step]
    const valid = await form.trigger(fields)
    if (!valid) return
    const nextStep = Math.min(step + 1, TOTAL_STEPS)
    setStep(nextStep)
    saveDraftStep(nextStep)
  }

  function goBack() {
    const prevStep = Math.max(step - 1, 1)
    setStep(prevStep)
    saveDraftStep(prevStep)
  }

  async function onSubmit(values: MemberFormValues) {
    setSubmitError(null)
    try {
      await submitMemberProfile(values)
      clearDraft()
      setSubmitted(true)
    } catch {
      setSubmitError(t('memberForm.errorGeneric'))
    }
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <Card className="text-center">
          <h1 className="text-2xl font-semibold text-slate-900">{t('memberForm.successTitle')}</h1>
          <p className="mt-4 text-sm text-slate-600">{t('memberForm.successText')}</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">{t('memberForm.title')}</h1>

      <StepIndicator
        currentStep={step}
        totalSteps={TOTAL_STEPS}
        stepLabel={t(`memberForm.steps.${STEP_LABEL_KEYS[step - 1]}`)}
      />

      <Card className="mt-6">
        <form
          onSubmit={
            step === TOTAL_STEPS ? form.handleSubmit(onSubmit) : (event) => event.preventDefault()
          }
          noValidate
        >
          <StepComponent form={form} />

          {submitError && <p className="mt-4 text-sm text-error">{submitError}</p>}

          <div className="mt-8 flex items-center justify-between">
            <Button type="button" variant="ghost" onClick={goBack} disabled={step === 1}>
              {t('memberForm.previous')}
            </Button>

            {step < TOTAL_STEPS ? (
              <Button type="button" onClick={() => void goNext()}>
                {t('memberForm.next')}
              </Button>
            ) : (
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {t('memberForm.submit')}
              </Button>
            )}
          </div>
        </form>
      </Card>
    </div>
  )
}
