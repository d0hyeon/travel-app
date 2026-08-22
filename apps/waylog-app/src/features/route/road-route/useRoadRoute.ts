import AsyncStorage from '@react-native-async-storage/async-storage'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { Coordinate } from '@waylog/domains/map'
import { getRoadDirections, type RoadRoute } from '@waylog/domains/route'
import { isOverseasByCoordinate } from '@waylog/utility'

// 웹과 같은 시그니처를 유지한다. 캐시 계층만 다르다 —
// 웹은 IndexedDB, 앱은 AsyncStorage 다.
interface UseRoadRouteOptions {
  waypoints: Coordinate[]
  suspense?: boolean
}

const CACHE_PREFIX = 'roadRoute:'

async function readCache(key: string): Promise<RoadRoute | null> {
  const cached = await AsyncStorage.getItem(CACHE_PREFIX + key)
  return cached == null ? null : (JSON.parse(cached) as RoadRoute)
}

export function useRoadRoute({ waypoints, suspense = true }: UseRoadRouteOptions) {
  const serialized = waypoints.map((p) => `${p.lat},${p.lng}`).join('|')

  const query = useQuery({
    queryKey: ['directions', serialized],
    queryFn: async (): Promise<RoadRoute> => {
      const cached = await readCache(serialized)
      if (cached != null) {
        return { coordinates: cached.coordinates, legs: cached.legs ?? [] }
      }

      const region = waypoints.some((x) => isOverseasByCoordinate(x.lat, x.lng))
        ? 'global'
        : 'korea'
      const roadRoute = await getRoadDirections(waypoints, region)

      await AsyncStorage.setItem(CACHE_PREFIX + serialized, JSON.stringify(roadRoute))

      return roadRoute
    },
    staleTime: Infinity,
    gcTime: 1000 * 60 * 30,
    refetchInterval: false,
    refetchOnMount: false,
    placeholderData: keepPreviousData,
    throwOnError: suspense,
  })

  return { ...query, data: query.data ?? { coordinates: waypoints, legs: [] } }
}
