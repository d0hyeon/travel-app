import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs'
import { AuthGuard, useAuth } from '@waylog/domains/clients'
import { Redirect } from 'expo-router'
import { UserProfileScreen } from '../../src/features/user-profile/UserProfileScreen'

export default function ProfileTabRoute() {
  return (
    <AuthGuard fallback={<Redirect href="/login" />}>
      <MyProfileScreen />
    </AuthGuard>
  )
}

function MyProfileScreen() {
  const { data: auth } = useAuth()
  const bottomTabBarHeight = useBottomTabBarHeight()

  return <UserProfileScreen userId={auth.id} bottomContentInset={bottomTabBarHeight} />
}
