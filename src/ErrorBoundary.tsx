import { Component, type ErrorInfo, type ReactNode } from 'react'
import { useI18n } from './i18n'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

class ErrorBoundaryInner extends Component<
  Props & { t: (key: string) => string },
  State
> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('UI crash:', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="panel error" style={{ margin: '1rem' }}>
          <h2>{this.props.t('errors.uiTitle')}</h2>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.85rem' }}>{this.state.error.message}</pre>
          <button type="button" onClick={() => window.location.reload()}>
            {this.props.t('errors.reload')}
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export function ErrorBoundary({ children }: Props) {
  const { t } = useI18n()
  return <ErrorBoundaryInner t={t}>{children}</ErrorBoundaryInner>
}
