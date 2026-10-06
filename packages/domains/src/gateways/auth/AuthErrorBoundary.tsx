import { ErrorBoundary } from '@waylog/react'
import type { ComponentProps, PropsWithChildren } from 'react'
import { AuthError } from './AuthError'

type Props = PropsWithChildren<{
  /** 세션 만료(AuthError) 감지 시 로그인 화면으로 보내는 콜백. 각 앱이 자신의 라우터로 주입한다. */
  onSessionExpired: () => void
}>

export function AuthErrorBoundary({ onSessionExpired, children }: Props) {
  const onError: ComponentProps<typeof ErrorBoundary>['onError'] = (_, resetError) => {
    onSessionExpired()
    resetError()
  }

  return (
    <ErrorBoundary onError={onError} ignoreError={(error) => !AuthError.isAuthError(error)}>
      {children}
    </ErrorBoundary>
  )
}
