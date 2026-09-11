import { Redirect, useLocalSearchParams, usePathname, useRouter } from 'expo-router'

const HOME = '/'
const LOGIN = '/login'
const RETURN_TO = 'returnTo'

function toLoginHref(returnTo: string) {
  return { pathname: LOGIN, params: { [RETURN_TO]: returnTo } } as const
}

// 외부에서 심어진 절대 URL 로 튕기지 않도록 앱 내부 경로만 받아들인다.
function isInAppPath(path: string) {
  return path.startsWith('/') && !path.startsWith('//')
}

/** 인증이 필요한 화면의 fallback. 돌아올 자리를 들고 로그인으로 보낸다. */
export function LoginRedirect() {
  const pathname = usePathname()

  return <Redirect href={toLoginHref(pathname)} />
}

/** 세션 만료를 감지한 쪽이 명령형으로 호출한다. */
export function useLoginRedirect() {
  const router = useRouter()
  const pathname = usePathname()

  return () => router.replace(toLoginHref(pathname))
}

/** 로그인 성공 후 돌아갈 자리. 지정되지 않았으면 홈이다. */
export function useReturnTo() {
  const { [RETURN_TO]: returnTo } = useLocalSearchParams<{ [RETURN_TO]?: string }>()

  if (returnTo == null || !isInAppPath(returnTo)) return HOME

  return returnTo
}
