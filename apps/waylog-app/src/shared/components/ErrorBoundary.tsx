import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode | ((retry: () => void) => ReactNode)
}

interface State {
  hasError: boolean
}

// 웹 ErrorBoundary 와 같은 역할이다. 하위가 던지면 fallback 으로 대체한다.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn('[ErrorBoundary]', error.message, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      if (typeof this.props.fallback === 'function') {
        return this.props.fallback(() => this.setState({ hasError: false }))
      }
      return this.props.fallback ?? null
    }
    return this.props.children
  }
}
