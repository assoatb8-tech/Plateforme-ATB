import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode
  error?: string
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, id, className, ...props }, ref) => {
    const checkboxId = id ?? props.name

    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={checkboxId} className="flex items-start gap-2 text-sm text-slate-700">
          <input
            id={checkboxId}
            ref={ref}
            type="checkbox"
            aria-invalid={Boolean(error)}
            className={cn(
              'mt-0.5 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/30',
              className,
            )}
            {...props}
          />
          <span>{label}</span>
        </label>
        {error && <p className="text-sm text-error">{error}</p>}
      </div>
    )
  },
)

Checkbox.displayName = 'Checkbox'
