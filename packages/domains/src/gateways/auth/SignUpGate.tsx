import type { PropsWithChildren, ReactNode } from 'react'
import { usePendingSignUp } from './useAuth'

type Props = PropsWithChildren<{
  fallback: ReactNode
}>

export function SignUpGate({ fallback, children }: Props) {
  const pendingUser = usePendingSignUp()

  if (pendingUser != null) return <>{fallback}</>

  return <>{children}</>
}
