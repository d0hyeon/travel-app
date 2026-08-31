import { useQueries } from '@tanstack/react-query'
import type { Coordinate } from '@waylog/domains/modules/map'
import { getRoadDirections, type RouteLeg } from '@waylog/domains/modules/route'
import { isOverseasByCoordinate } from '@waylog/utility'
import { roadRouteQueryKey, readRoadRouteCache, writeRoadRouteCache } from '../../../route/road-route/useRoadRoute'

// AIRMap 은 지도용이 아닌 자식(컴포넌트·조각)을 만나면 그 자식들을 같은
// 인덱스에 밀어넣어 내부 배열이 깨진다. 그래서 컴포넌트로 감싸지 않고
// 훅으로 구간만 얻어 호출부가 Map.Path 를 직접 펼친다.
//
// 같은 날짜의 route가 여러 개면 각각의 구간을 동시에 조회해야 한다.
// route 개수가 렌더마다 달라져 useRoadRoute 를 반복 호출할 수 없으므로 useQueries 를 쓴다.
export function useRouteLegsPathList(waypointsList: Coordinate[][]): RouteLeg[][] {
  const results = useQueries({
    queries: waypointsList.map((waypoints) => {
      const serialized = waypoints.map((p) => `${p.lat},${p.lng}`).join('|')

      return {
        queryKey: roadRouteQueryKey(serialized),
        queryFn: async () => {
          const cached = await readRoadRouteCache(serialized)
          if (cached != null) return cached

          const region = waypoints.some((x) => isOverseasByCoordinate(x.lat, x.lng)) ? 'global' : 'korea'
          const roadRoute = await getRoadDirections(waypoints, region)
          await writeRoadRouteCache(serialized, roadRoute)
          return roadRoute
        },
        staleTime: Infinity,
        gcTime: 1000 * 60 * 30,
        refetchInterval: false,
        refetchOnMount: false,
      }
    }),
  })

  return results.map((result) => result.data?.legs ?? [])
}
