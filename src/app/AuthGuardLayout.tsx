import { Outlet } from 'react-router'
import { AuthNavigate } from '~features/auth/AuthNavigate'
import { useAuth } from '~features/auth/useAuth'

export default function AuthGuardLayout() {
  const { data: user } = useAuth()

  if (!user) {
    return <AuthNavigate />
  }

  return <Outlet />
}
