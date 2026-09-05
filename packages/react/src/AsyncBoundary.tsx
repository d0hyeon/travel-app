import { Suspense, type ComponentProps, type ReactNode } from 'react'
import { ErrorBoundary, type FallbackProps } from './ErrorBoundary'

type ErrorBoundaryProps = ComponentProps<typeof ErrorBoundary>
export type RejectedFallbackProps = FallbackProps

export interface AsyncBoundaryProps {
  resetKeys?: ErrorBoundaryProps['resetKeys']
  rejectedFallback?: (props: RejectedFallbackProps) => ReactNode
  pendingFallback?: ReactNode
  onError?: ErrorBoundaryProps['onError']
  children?: ReactNode
}

export function AsyncBoundary({
  pendingFallback,
  rejectedFallback,
  onError,
  resetKeys,
  children,
}: AsyncBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={rejectedFallback}
      onError={onError}
      resetKeys={resetKeys}
    >
      <Suspense fallback={pendingFallback}>{children}</Suspense>
    </ErrorBoundary>
  )
}
