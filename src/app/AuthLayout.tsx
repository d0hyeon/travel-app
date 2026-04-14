import { Outlet, useLocation } from 'react-router'
import { AuthNavigate } from '~features/auth/AuthNavigate'
import { useAuth } from '~features/auth/useAuth'

export default function AuthLayout() {
  const { data: user } = useAuth()
  const location = useLocation()

  if (!user) {
    return <AuthNavigate />
  }

  return <Outlet />
}
