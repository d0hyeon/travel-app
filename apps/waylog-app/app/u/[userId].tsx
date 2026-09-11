import { AuthGuard } from '@waylog/domains/clients'
import { Redirect, useLocalSearchParams } from 'expo-router'
import { UserProfileScreen } from '../../src/features/user-profile/UserProfileScreen'
import { LoginRedirect } from '../../src/features/auth/auth-redirect'

export default function UserProfileRoute() {
  const { userId } = useLocalSearchParams<{ userId: string }>()

  if (userId == null) return <Redirect href="/" />

  return (
    <AuthGuard fallback={<LoginRedirect />}>
      <UserProfileScreen userId={userId} />
    </AuthGuard>
  )
}
