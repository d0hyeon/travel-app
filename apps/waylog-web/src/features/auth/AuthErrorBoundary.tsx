import type { PropsWithChildren } from "react";
import { ErrorBoundary } from "~shared/components/ErrorBoundary";
import { useAuthNavigate } from "./AuthNavigate";
import { AuthError } from "@waylog/domains/clients";

export function AuthErrorBoundary(props: PropsWithChildren) {
  const login = useAuthNavigate();

  return (
    <ErrorBoundary
      onError={async (_, resetError) => {
        await login()
        resetError();
      }}
      ignoreError={error => !AuthError.isAuthError(error)}
    >
      {props.children}
    </ErrorBoundary>
  )
}