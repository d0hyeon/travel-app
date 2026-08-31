import { Suspense, type ComponentProps, type ReactNode } from 'react'
import { ErrorBoundary, type FallbackProps } from '../ErrorBoundary'

type ErrorBoundaryProps = ComponentProps<typeof ErrorBoundary>
export type RejectedFallbackProps = FallbackProps

export interface AsyncBoundaryProps {
  resetKeys?: ErrorBoundaryProps['resetKeys']
  rejectedFallback?: ErrorBoundaryProps['fallback']
  pendingFallback?: ReactNode
  children?: ReactNode
}

// 웹 shared/components/utils/AsyncBoundary.tsx 와 같은 역할이다.
// 로딩과 에러라는 두 대기 상태를 한 경계에서 선언한다.
export function AsyncBoundary({
  pendingFallback,
  rejectedFallback,
  resetKeys,
  children,
}: AsyncBoundaryProps) {
  return (
    <ErrorBoundary fallback={rejectedFallback} resetKeys={resetKeys}>
      <Suspense fallback={pendingFallback}>{children}</Suspense>
    </ErrorBoundary>
  )
}
