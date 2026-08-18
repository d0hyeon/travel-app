import { Suspense, type ComponentProps, type ReactNode } from "react";
import { ErrorBoundary, type FallbackProps } from "../ErrorBoundary";

type ErrorBoudaryProps = ComponentProps<typeof ErrorBoundary>;
export type RejectedFallbackProps = FallbackProps;

export interface AsyncBoudaryProps {
  resetKeys?: ErrorBoudaryProps['resetKeys'];
  rejectedFallback?: (props: RejectedFallbackProps) => ReactNode;
  pendingFallback?: ReactNode;
  onError?: ErrorBoudaryProps['onError'];
  children?: ReactNode;
}

export function AsyncBoundary({
  pendingFallback,
  rejectedFallback,
  onError,
  resetKeys,
  children
}: AsyncBoudaryProps) {
  return (
    <ErrorBoundary
      fallback={rejectedFallback}
      onError={onError}
      resetKeys={resetKeys}
    >
      <Suspense fallback={pendingFallback}>
        {children}
      </Suspense>
    </ErrorBoundary>
  )
}