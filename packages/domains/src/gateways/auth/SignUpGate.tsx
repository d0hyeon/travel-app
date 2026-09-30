import type { PropsWithChildren, ReactNode } from 'react'
import { usePendingSignUp } from './useAuth'

type Props = PropsWithChildren<{
  /** 가입을 마치지 않은 사용자에게 children 대신 그릴 약관 동의 화면. 각 앱이 자신의 UI로 주입한다. */
  fallback: ReactNode
}>

export function SignUpGate({ fallback, children }: Props) {
  const pendingUser = usePendingSignUp()

  if (pendingUser != null) return <>{fallback}</>

  return <>{children}</>
}
