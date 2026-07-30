import { forwardRef, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, id, className, rows = 3, required, ...props }, ref) => {
    const textareaId = id ?? props.name
    const errorId = textareaId ? `${textareaId}-error` : undefined

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={textareaId} className="text-sm font-medium text-slate-700">
            {label}
            {required && (
              <span className="text-error" aria-hidden="true">
                {' '}
                *
              </span>
            )}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          rows={rows}
          required={required}
          aria-required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            'rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900',
            'placeholder:text-slate-400',
            'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30',
            error && 'border-error focus:border-error focus:ring-error/30',
            className,
          )}
          {...props}
        />
        {error && (
          <p id={errorId} role="alert" className="text-sm text-error">
            {error}
          </p>
        )}
      </div>
    )
  },
)

Textarea.displayName = 'Textarea'
