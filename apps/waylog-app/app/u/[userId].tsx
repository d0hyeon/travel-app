import { useAuth } from '@waylog/domains/clients'
import { Redirect, useLocalSearchParams } from 'expo-router'
import { UserProfileScreen } from '../../src/features/user-profile/UserProfileScreen'

export default function UserProfileRoute() {
  const { data: auth } = useAuth({ required: false })
  const { userId } = useLocalSearchParams<{ userId: string }>()
  if (auth == null) return <Redirect href="/login" />
  if (userId == null) return <Redirect href="/" />
  return <UserProfileScreen userId={userId} />
}
