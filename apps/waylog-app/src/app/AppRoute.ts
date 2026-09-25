// react-navigation 스크린 이름에 콜론(:)이 들어가면 getPatternParts가
// path 파라미터 문법으로 오인해 예외를 던질 수 있다(alias·중첩 조합 시).
// 그래서 앱은 원본 AppRoute 대신 콜론을 치환한 이 버전만 스크린 이름으로 쓴다.
import { AppRoute as BaseAppRoute } from '@waylog/routes'

export function toScreenName(path: string): string {
  return path.replaceAll(':', '_')
}

export const AppRoute = Object.fromEntries(
  Object.entries(BaseAppRoute).map(([key, value]) => [key, toScreenName(value)]),
) as typeof BaseAppRoute
