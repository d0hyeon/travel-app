import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode | ((props: { error: Error; reset: () => void }) => ReactNode)
  /** 값이 바뀌면 에러 상태를 푼다. 웹 ErrorBoundary 와 같은 동작이다. */
  resetKeys?: unknown[]
}

interface State {
  error: Error | null;
  resetKeys: unknown[]
}

// 웹 ErrorBoundary 와 같은 역할이다. 하위가 던지면 fallback 으로 대체한다.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, resetKeys: this.props.resetKeys ?? [] }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  static getDerivedStateFromProps(props: Props, state: State) {
    const nextKeys = props.resetKeys ?? []
    const hasChanged =
      nextKeys.length !== state.resetKeys.length ||
      nextKeys.some((key, index) => !Object.is(key, state.resetKeys[index]))

    if (!hasChanged) return null;

    return { error: null, resetKeys: nextKeys }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Error 가 아닌 값이 던져지기도 한다 — 예: API 가 응답 객체를 그대로 던지는 경우.
    // message 만 찍으면 undefined 가 되어 원인을 못 본다.
    console.warn('[ErrorBoundary]', describeError(error), info.componentStack)
  }

  render() {
    if (this.state.error != null) {
      if (typeof this.props.fallback === 'function') {
        const props = {
          error: this.state.error,
          reset: () => this.setState({ error: null })
        }
        return this.props.fallback(props)
      }
      return this.props.fallback ?? null
    }
    return this.props.children
  }
}

function describeError(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error

  try {
    return JSON.stringify(error)
  } catch {
    return String(error)
  }
}
