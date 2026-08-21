import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode | ((retry: () => void) => ReactNode)
  /** 값이 바뀌면 에러 상태를 푼다. 웹 ErrorBoundary 와 같은 동작이다. */
  resetKeys?: unknown[]
}

interface State {
  hasError: boolean
  resetKeys: unknown[]
}

// 웹 ErrorBoundary 와 같은 역할이다. 하위가 던지면 fallback 으로 대체한다.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, resetKeys: this.props.resetKeys ?? [] }

  static getDerivedStateFromError(): Pick<State, 'hasError'> {
    return { hasError: true }
  }

  static getDerivedStateFromProps(props: Props, state: State): State | null {
    const nextKeys = props.resetKeys ?? []
    const hasChanged =
      nextKeys.length !== state.resetKeys.length ||
      nextKeys.some((key, index) => !Object.is(key, state.resetKeys[index]))

    if (!hasChanged) return null

    return { hasError: false, resetKeys: nextKeys }
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
