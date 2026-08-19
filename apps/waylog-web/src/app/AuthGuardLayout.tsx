import { Outlet } from "react-router";
import { AuthNavigate } from "~features/auth/AuthNavigate";
import { useAuth } from "@waylog/domains/auth";

export default function AuthGuardLayout() {
  const { data: user } = useAuth({ required: false });

  if (user == null) {
    return <AuthNavigate />
  }

  return (
    <Outlet />
  )
}