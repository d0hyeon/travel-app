import type { PropsWithChildren, ReactNode } from 'react'
import { useAuth } from './useAuth'

type Props = PropsWithChildren<{
  /** 세션이 없을 때 children 대신 그릴 것. 각 앱이 자신의 라우터로 주입한다. */
  fallback: ReactNode
}>

export function AuthGuard({ fallback, children }: Props) {
  const { data: auth } = useAuth({ required: false })

  if (auth == null) return <>{fallback}</>

  return <>{children}</>
}
