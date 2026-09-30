import { Outlet } from "react-router";
import { AuthNavigate } from "~features/auth/AuthNavigate";
import { SignUpConsent } from "~features/auth/SignUpConsent";
import { AuthGuard, SignUpGate } from "@waylog/domains/clients";

export default function AuthGuardLayout() {
  return (
    <SignUpGate fallback={<SignUpConsent />}>
      <AuthGuard fallback={<AuthNavigate />}>
        <Outlet />
      </AuthGuard>
    </SignUpGate>
  )
}
