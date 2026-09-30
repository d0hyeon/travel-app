import { Outlet } from "react-router";
import { AuthNavigate } from "~features/auth/AuthNavigate";
import { AuthGuard } from "@waylog/domains/clients";

export default function AuthGuardLayout() {
  return (
    <AuthGuard fallback={<AuthNavigate />}>
      <Outlet />
    </AuthGuard>
  )
}
