import { useEffect } from 'react'
import { useAppNavigation } from '../../shared/hooks/useAppNavigation'
import type { RootStackParamList } from '../../app/routes'

type ReturnTo = { screen: keyof RootStackParamList; params?: Record<string, unknown> }

const HOME: ReturnTo = { screen: 'Home' }

/**
 * 인증이 필요한 화면의 fallback. 돌아올 자리를 들고 로그인으로 보낸다.
 * expo-router 시절엔 `usePathname()`으로 현재 URL을 얻었지만, react-navigation엔
 * 파일 경로 개념이 없어 호출부가 명시적으로 `returnTo`를 넘긴다.
 */
export function RequireAuthRedirect({ returnTo = HOME }: { returnTo?: ReturnTo }) {
  const navigation = useAppNavigation()

  useEffect(() => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login', params: { returnTo } }],
    })
    // returnTo 는 호출부에서 인라인 객체로 넘어오는 경우가 많아 매 렌더 참조가 바뀔 수 있다.
    // screen 값만 실제로 의미 있는 변경이므로 그것만 의존성으로 좁힌다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation, returnTo.screen])

  return null
}

/**
 * 세션 만료를 감지한 쪽이 명령형으로 호출한다. 네비게이터 트리 최상단(스크린이 아닌
 * 위치)에서도 동작해야 하므로 useAppRoute(=useRoute) 대신 현재 활성 라우트를
 * navigation.getState()에서 직접 읽는다.
 */
export function useLoginRedirect() {
  const navigation = useAppNavigation()

  return () => {
    const state = navigation.getState()
    const activeRoute = state?.routes[state.index]
    const returnTo: ReturnTo = activeRoute == null
      ? HOME
      : { screen: activeRoute.name as keyof RootStackParamList, params: activeRoute.params as Record<string, unknown> }
    navigation.reset({ index: 0, routes: [{ name: 'Login', params: { returnTo } }] })
  }
}
