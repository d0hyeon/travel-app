import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs'
import { AuthGuard, useAuth } from '@waylog/domains/clients'
import { UserProfileScreen } from '../../src/features/user-profile/UserProfileScreen'
import { LoginRedirect } from '../../src/features/auth/auth-redirect'

export default function ProfileTabRoute() {
  return (
    <AuthGuard fallback={<LoginRedirect />}>
      <MyProfileScreen />
    </AuthGuard>
  )
}

function MyProfileScreen() {
  const { data: auth } = useAuth()
  const bottomTabBarHeight = useBottomTabBarHeight()

  return <UserProfileScreen userId={auth.id} bottomContentInset={bottomTabBarHeight} />
}
