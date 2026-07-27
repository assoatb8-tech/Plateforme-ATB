import { useTranslation } from 'react-i18next'
import { cn } from '@/utils/cn'

interface StepIndicatorProps {
  currentStep: number
  totalSteps: number
  stepLabel: string
}

export function StepIndicator({ currentStep, totalSteps, stepLabel }: StepIndicatorProps) {
  const { t } = useTranslation()

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-medium text-slate-500">
          {t('memberForm.stepProgress', { current: currentStep, total: totalSteps })}
        </p>
        <p className="text-sm font-semibold text-slate-900">{stepLabel}</p>
      </div>
      <div className="mt-2 flex gap-1.5">
        {Array.from({ length: totalSteps }, (_, index) => (
          <div
            key={index}
            className={cn(
              'h-1.5 flex-1 rounded-full',
              index < currentStep ? 'bg-primary' : 'bg-slate-200',
            )}
          />
        ))}
      </div>
    </div>
  )
}
