import { AuthGuard } from '@waylog/domains/clients'
import { Redirect, useLocalSearchParams } from 'expo-router'
import { UserProfileScreen } from '../../src/features/user-profile/UserProfileScreen'

export default function UserProfileRoute() {
  const { userId } = useLocalSearchParams<{ userId: string }>()

  if (userId == null) return <Redirect href="/" />

  return (
    <AuthGuard fallback={<Redirect href="/login" />}>
      <UserProfileScreen userId={userId} />
    </AuthGuard>
  )
}
