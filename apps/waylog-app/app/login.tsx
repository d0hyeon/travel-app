import { useAuth } from '@waylog/domains/clients'
import { Redirect } from 'expo-router'
import { LoginScreen } from '../src/features/auth/LoginScreen'

export default function LoginRoute() {
  const { data: auth } = useAuth({ required: false })

  if (auth != null) return <Redirect href="/" />

  return <LoginScreen />
}
