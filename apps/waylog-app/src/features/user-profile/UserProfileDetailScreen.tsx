import { useAppRoute } from '../../shared/hooks/useAppNavigation'
import { UserProfileScreen } from './UserProfileScreen'

export function UserProfileDetailScreen() {
  const { params } = useAppRoute<'UserProfile'>()
  return <UserProfileScreen userId={params.userId} />
}
