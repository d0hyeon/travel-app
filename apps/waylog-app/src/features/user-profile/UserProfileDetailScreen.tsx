import { AuthGuard } from '@waylog/domains/clients'
import { useAppRoute } from '../../shared/hooks/useAppNavigation'
import { RequireAuthRedirect } from '../auth/auth-redirect'
import { UserProfileScreen } from './UserProfileScreen'

export function UserProfileDetailScreen() {
  const { params } = useAppRoute<'UserProfile'>()
  return (
    <AuthGuard fallback={<RequireAuthRedirect />}>
      <UserProfileScreen userId={params.userId} />
    </AuthGuard>
  )
}
