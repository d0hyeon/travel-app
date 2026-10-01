import { useEffect } from 'react'
import { useAppNavigation, useAppRoute } from '../../shared/hooks/useAppNavigation'
import type { RootStackParamList } from '~app/routes'
import { AppRoute } from '../../app/AppRoute'

export type ReturnTo = { screen: keyof RootStackParamList; params?: Record<string, unknown> }

const HOME: ReturnTo = { screen: AppRoute.메인 }

/**
 * 인증이 필요한 화면의 fallback. 돌아올 자리를 들고 로그인으로 보낸다.
 * expo-router 시절엔 `usePathname()`으로 현재 URL을 얻었지만, react-navigation엔
 * 파일 경로 개념이 없다. 기본값은 이 컴포넌트를 fallback으로 렌더한 스크린 자신의
 * route(useAppRoute)로 삼고, HomeTabs의 탭처럼 그 스크린 자체가 라우트가 아닌
 * 경우에만 호출부가 명시적으로 returnTo를 넘긴다.
 */
export function RequireAuthRedirect({ returnTo }: { returnTo?: ReturnTo }) {
  const navigation = useAppNavigation()
  const route = useAppRoute()
  const resolvedReturnTo = returnTo ?? { screen: route.name, params: route.params as Record<string, unknown> }

  useEffect(() => {
    navigation.reset({
      index: 0,
      routes: [{ name: AppRoute.로그인, params: { returnTo: resolvedReturnTo } }],
    })
    // resolvedReturnTo 는 매 렌더 새 객체일 수 있다. screen 값만 실제로 의미 있는
    // 변경이므로 그것만 의존성으로 좁힌다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation, resolvedReturnTo.screen])

  return null
}

/** 로그인이 필요한 화면에서 세션이 없어지면 로그인 대신 홈으로 돌려보낸다. */
export function SignedOutRedirect() {
  const navigation = useAppNavigation()

  useEffect(() => {
    navigation.reset({ index: 0, routes: [{ name: AppRoute.메인 }] })
  }, [navigation])

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
      : { screen: activeRoute.name, params: activeRoute.params as Record<string, unknown> }
    navigation.reset({ index: 0, routes: [{ name: AppRoute.로그인, params: { returnTo } }] })
  }
}
