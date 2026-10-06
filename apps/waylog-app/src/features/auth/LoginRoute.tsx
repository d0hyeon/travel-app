import { StackActions } from '@react-navigation/native'
import { useEffect } from 'react'
import { useAuth } from '@waylog/domains/clients'
import { useAppNavigation, useAppRoute } from '~shared/hooks/useAppNavigation'
import { AppRoute } from '~app/AppRoute'
import { LoginScreen } from './LoginScreen'

export function LoginRoute() {
  const { data: auth } = useAuth({ required: false })
  const navigation = useAppNavigation()
  const { params } = useAppRoute<typeof AppRoute.로그인>()
  const returnTo = params?.returnTo ?? { screen: AppRoute.메인 }

  useEffect(() => {
    if (auth == null) return
    const { routes, index } = navigation.getState()
    if (routes[index - 1]?.name === returnTo.screen) return navigation.goBack()
    navigation.dispatch(StackActions.replace(returnTo.screen, returnTo.params))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth, navigation, returnTo.screen])

  if (auth != null) return null

  return <LoginScreen />
}
