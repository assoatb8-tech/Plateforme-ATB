import { Component, type ErrorInfo, type ReactNode } from 'react'
import { withTranslation, type WithTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'

interface ErrorBoundaryProps extends WithTranslation {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

// Class component, not a hook — React only supports catching render-time
// errors via getDerivedStateFromError/componentDidCatch, no hook
// equivalent exists. withTranslation() (the HOC form of react-i18next)
// is used instead of useTranslation() for the same reason.
class ErrorBoundaryBase extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Unhandled render error:', error, errorInfo)
  }

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children
    }

    const { t } = this.props
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
        <h1 className="text-xl font-semibold text-slate-900">{t('errorBoundary.title')}</h1>
        <p className="max-w-md text-sm text-slate-600">{t('errorBoundary.message')}</p>
        <Button type="button" onClick={() => window.location.reload()}>
          {t('errorBoundary.reload')}
        </Button>
      </div>
    )
  }
}

export const ErrorBoundary = withTranslation()(ErrorBoundaryBase)
