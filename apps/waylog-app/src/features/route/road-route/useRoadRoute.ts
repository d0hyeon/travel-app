import AsyncStorage from '@react-native-async-storage/async-storage'
import { keepPreviousData } from '@tanstack/react-query'
import type { Coordinate } from '@waylog/domains/modules/map'
import { getRoadDirections, type RoadRoute } from '@waylog/domains/modules/route'
import { useQuery } from '@waylog/react'
import { isOverseasByCoordinate } from '@waylog/utility'

// 웹과 같은 시그니처를 유지한다. 캐시 계층만 다르다 —
// 웹은 IndexedDB, 앱은 AsyncStorage 다.
interface UseRoadRouteOptions {
  waypoints: Coordinate[]
  /** 교통 구간의 경계. 이 인덱스와 다음 인덱스 사이는 도로로 잇지 않는다. */
  breakIndices?: number[]
  suspense?: boolean
}

const CACHE_PREFIX = 'roadRoute:'

export function roadRouteQueryKey(serialized: string) {
  return ['directions', serialized]
}

export async function readRoadRouteCache(key: string): Promise<RoadRoute | null> {
  const cached = await AsyncStorage.getItem(CACHE_PREFIX + key)
  return cached == null ? null : (JSON.parse(cached) as RoadRoute)
}

export async function writeRoadRouteCache(key: string, roadRoute: RoadRoute): Promise<void> {
  await AsyncStorage.setItem(CACHE_PREFIX + key, JSON.stringify(roadRoute))
}

export function useRoadRoute({ waypoints, breakIndices, suspense = true }: UseRoadRouteOptions) {
  const serialized = waypoints.map((p) => `${p.lat},${p.lng}`).join('|')
  // 같은 좌표라도 경계가 다르면 다른 경로다.
  const cacheKey = breakIndices?.length ? `${serialized}#${breakIndices.join(',')}` : serialized

  const query = useQuery({
    queryKey: roadRouteQueryKey(cacheKey),
    queryFn: async (): Promise<RoadRoute> => {
      const cached = await readRoadRouteCache(cacheKey)
      if (cached != null) {
        return { coordinates: cached.coordinates, legs: cached.legs ?? [] }
      }

      const region = waypoints.some((x) => isOverseasByCoordinate(x.lat, x.lng))
        ? 'global'
        : 'korea'
      const roadRoute = await getRoadDirections(waypoints, region, breakIndices)

      await writeRoadRouteCache(cacheKey, roadRoute)

      return roadRoute
    },
    staleTime: Infinity,
    gcTime: 1000 * 60 * 30,
    refetchInterval: false,
    refetchOnMount: false,
    placeholderData: keepPreviousData,
    suspense,
  })

  return { ...query, data: query.data ?? { coordinates: waypoints, legs: [] } }
}
