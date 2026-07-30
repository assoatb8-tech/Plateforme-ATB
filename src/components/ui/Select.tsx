import { forwardRef, type SelectHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: SelectOption[]
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, id, className, options, placeholder, required, ...props }, ref) => {
    const selectId = id ?? props.name
    const errorId = selectId ? `${selectId}-error` : undefined

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="text-sm font-medium text-slate-700">
            {label}
            {required && (
              <span className="text-error" aria-hidden="true">
                {' '}
                *
              </span>
            )}
          </label>
        )}
        <select
          id={selectId}
          ref={ref}
          required={required}
          aria-required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            'rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900',
            'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30',
            error && 'border-error focus:border-error focus:ring-error/30',
            className,
          )}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p id={errorId} role="alert" className="text-sm text-error">
            {error}
          </p>
        )}
      </div>
    )
  },
)

Select.displayName = 'Select'
