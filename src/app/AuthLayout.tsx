import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '~features/auth/useAuth'

export default function AuthLayout() {
  const { data: user } = useAuth()
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}
