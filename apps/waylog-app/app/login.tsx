import { useAuth } from '@waylog/domains/clients'
import { Redirect } from 'expo-router'
import { useReturnTo } from '../src/features/auth/auth-redirect'
import { LoginScreen } from '../src/features/auth/LoginScreen'

export default function LoginRoute() {
  const { data: auth } = useAuth({ required: false })
  const returnTo = useReturnTo()

  if (auth != null) return <Redirect href={returnTo} />

  return <LoginScreen />
}
