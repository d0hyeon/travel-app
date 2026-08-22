import { useAuth } from '@waylog/domains/clients'
import { Redirect } from 'expo-router'
import { UserProfileScreen } from '../../src/features/user-profile/UserProfileScreen'

export default function ProfileTabRoute() {
  const { data: auth } = useAuth({ required: false })
  if (auth == null) return <Redirect href="/login" />
  return <UserProfileScreen userId={auth.id} />
}
