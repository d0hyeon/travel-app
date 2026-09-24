import { useEffect } from 'react'
import { useAuth } from '@waylog/domains/clients'
import { useAppNavigation, useAppRoute } from '../../shared/hooks/useAppNavigation'
import { LoginScreen } from './LoginScreen'

export function LoginRoute() {
  const { data: auth } = useAuth({ required: false })
  const navigation = useAppNavigation()
  const { params } = useAppRoute<'Login'>()
  const returnTo = params?.returnTo ?? { screen: 'Home' as const }

  useEffect(() => {
    if (auth == null) return
    navigation.reset({
      index: 0,
      routes: [{ name: returnTo.screen, params: returnTo.params } as never],
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth, navigation, returnTo.screen])

  if (auth != null) return null

  return <LoginScreen />
}
