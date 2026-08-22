import type { Coordinate } from '@waylog/domains/modules/map'
import type { RouteLeg } from '@waylog/domains/modules/route'
import { useRoadRoute } from '../../../route/road-route/useRoadRoute'

// AIRMap 은 지도용이 아닌 자식(컴포넌트·조각)을 만나면 그 자식들을 같은
// 인덱스에 밀어넣어 내부 배열이 깨진다. 그래서 컴포넌트로 감싸지 않고
// 훅으로 구간만 얻어 호출부가 Map.Path 를 직접 펼친다.
export function useRouteLegsPath(waypoints: Coordinate[]): RouteLeg[] {
  const {
    data: { legs },
  } = useRoadRoute({ waypoints, suspense: false })

  return legs
}
