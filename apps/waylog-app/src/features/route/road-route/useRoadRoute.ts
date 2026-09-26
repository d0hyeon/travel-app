import AsyncStorage from '@react-native-async-storage/async-storage'
import { keepPreviousData } from '@tanstack/react-query'
import { useQueries } from '@tanstack/react-query'
import type { Coordinate } from '@waylog/domains/modules/map'
import { getRoadDirections, type RoadRoute } from '@waylog/domains/modules/route'
import { useQuery } from '@waylog/react'
import { isOverseasByCoordinate } from '@waylog/utility'

// 웹과 같은 시그니처를 유지한다. 캐시 계층만 다르다 —
// 웹은 IndexedDB, 앱은 AsyncStorage 다.
interface UseRoadRouteOptions {
  waypoints: Coordinate[]
  suspense?: boolean
}

const CACHE_PREFIX = 'roadRoute:'
const STALE_TIME = Infinity
const GC_TIME = 1000 * 60 * 30

function serializeWaypoints(waypoints: Coordinate[]): string {
  return waypoints.map((p) => `${p.lat},${p.lng}`).join('|')
}

export function roadRouteQueryKey(serialized: string) {
  return ['directions', serialized]
}

async function readRoadRouteCache(key: string): Promise<RoadRoute | null> {
  const cached = await AsyncStorage.getItem(CACHE_PREFIX + key)
  return cached == null ? null : (JSON.parse(cached) as RoadRoute)
}

async function writeRoadRouteCache(key: string, roadRoute: RoadRoute): Promise<void> {
  await AsyncStorage.setItem(CACHE_PREFIX + key, JSON.stringify(roadRoute))
}

// 캐시 조회 → 없으면 도로 경로 조회 → 캐시 저장. useRoadRoute/useRoadRoutes가 공유하는
// 단일 소유 로직 — 여기서만 고치면 단일·다중 조회 양쪽에 함께 반영된다.
async function fetchRoadRoute(waypoints: Coordinate[], serialized: string): Promise<RoadRoute> {
  const cached = await readRoadRouteCache(serialized)
  if (cached != null) return { coordinates: cached.coordinates, legs: cached.legs ?? [] }

  const region = waypoints.some((x) => isOverseasByCoordinate(x.lat, x.lng)) ? 'global' : 'korea'
  const roadRoute = await getRoadDirections(waypoints, region)

  await writeRoadRouteCache(serialized, roadRoute)

  return roadRoute
}

export function useRoadRoute({ waypoints, suspense = true }: UseRoadRouteOptions) {
  const serialized = serializeWaypoints(waypoints)

  const query = useQuery({
    queryKey: roadRouteQueryKey(serialized),
    queryFn: () => fetchRoadRoute(waypoints, serialized),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    refetchInterval: false,
    refetchOnMount: false,
    placeholderData: keepPreviousData,
    suspense,
  })

  return { ...query, data: query.data ?? { coordinates: waypoints, legs: [] } }
}

// route 개수가 렌더마다 달라질 수 있어 useRoadRoute를 반복 호출할 수 없다(훅 규칙).
// 여러 route의 도로 경로를 한 번에 병렬 조회해야 하는 소비처(예: 여행 전체 기간을
// 한 지도에 그리는 정산 탭)를 위한 다중 버전.
export function useRoadRoutes(waypointsList: Coordinate[][]): RoadRoute[] {
  const results = useQueries({
    queries: waypointsList.map((waypoints) => {
      const serialized = serializeWaypoints(waypoints)

      return {
        queryKey: roadRouteQueryKey(serialized),
        queryFn: () => fetchRoadRoute(waypoints, serialized),
        staleTime: STALE_TIME,
        gcTime: GC_TIME,
        refetchInterval: false,
        refetchOnMount: false,
      }
    }),
  })

  return results.map((result, index) => result.data ?? { coordinates: waypointsList[index], legs: [] })
}
