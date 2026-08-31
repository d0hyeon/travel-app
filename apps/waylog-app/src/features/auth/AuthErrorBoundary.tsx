import { AuthError } from '@waylog/domains/clients'
import { router } from 'expo-router'
import { Component, type PropsWithChildren } from 'react'

interface State {
  caughtError: Error | null
}

/**
 * 웹 AuthErrorBoundary 와 같은 역할이다.
 * 세션이 만료되어 `useAuth({ required: true })` 가 AuthError 를 던지면 로그인 화면으로 보낸다.
 *
 * 인증과 무관한 에러는 이 바운더리의 책임이 아니므로 render 에서 그대로 재던져
 * 상위 바운더리에 위임한다. React 는 render 중 발생한 throw 만 상위로 전파하므로
 * getDerivedStateFromError 가 아니라 render 에서 던져야 한다.
 */
export class AuthErrorBoundary extends Component<PropsWithChildren, State> {
  state: State = { caughtError: null }

  static getDerivedStateFromError(error: Error) {
    return { caughtError: error }
  }

  componentDidUpdate() {
    if (!AuthError.isAuthError(this.state.caughtError)) return

    // 리다이렉트와 함께 에러 상태를 푼다. 그대로 두면 로그인 후 돌아왔을 때
    // 자식이 계속 fallback 상태에 머문다 — 웹의 resetError 호출과 같은 이유다.
    this.setState({ caughtError: null })
    router.replace('/login')
  }

  render() {
    const { caughtError } = this.state

    if (caughtError == null) return this.props.children
    if (AuthError.isAuthError(caughtError)) return null

    throw caughtError
  }
}
