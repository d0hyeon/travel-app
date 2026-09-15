import { supabase } from '../../gateways/client'
import { TransportType } from '../transport'
import type { RoadRoute } from './route.types'
import type { Coordinate } from '../../utils'
import { splitIntoSegments } from './roadRoute.utils'

// maxSize 로 나눈 조각은 끝점을 공유하므로 이어붙일 때 첫 점을 버린다.
// 교통 구간 경계로 나뉜 조각은 공유하지 않는다 -- 버리면 도착지가 사라진다.
function mergeRoadRoutes(routes: RoadRoute[], detachedIndices: Set<number> = new Set()): RoadRoute {
  if (routes.length === 0) return { coordinates: [], legs: [] }

  return routes.reduce((merged, route, index) => ({
    coordinates: [
      ...merged.coordinates,
      ...(detachedIndices.has(index) ? route.coordinates : route.coordinates.slice(1)),
    ],
    legs: [...merged.legs, ...route.legs],
  }))
}

// 도로 경로를 못 구한 구간은 시간 추정 없이 0으로 둔다 (소비자가 미표시 처리)
// fallback leg는 해당 구간의 시작·끝 두 점을 coordinates로 갖는다
function fallbackRoadRoute(waypoints: Coordinate[]): RoadRoute {
  return {
    coordinates: waypoints,
    legs: Array.from({ length: Math.max(waypoints.length - 1, 0) }, (_, i) => ({
      duration: 0,
      distance: 0,
      transport: TransportType.차량,
      coordinates: [waypoints[i], waypoints[i + 1]],
    })),
  }
}

async function fetchSegment(waypoints: Coordinate[], region: 'korea' | 'global'): Promise<RoadRoute> {
  try {
    const { data, error } = await supabase.functions.invoke('road-directions', {
      body: { waypoints, region },
    })
    if (error || !data?.coordinates) return fallbackRoadRoute(waypoints)
    return { coordinates: data.coordinates, legs: data.legs ?? [] }
  } catch {
    return fallbackRoadRoute(waypoints)
  }
}

// breakIndices 는 교통 구간의 경계다. 그 사이는 도로로 잇지 않는다 --
// 인천에서 오사카를 육로로 뚫으면 실패하고, 실패한 자리에 바다를 가로지르는
// 직선이 그려진다.
export async function getRoadDirections(
  waypoints: Coordinate[],
  region: 'korea' | 'global',
  breakIndices?: number[],
): Promise<RoadRoute> {
  if (waypoints.length < 2) return fallbackRoadRoute(waypoints)

  const hasBreak = breakIndices != null && breakIndices.length > 0
  if (!hasBreak && waypoints.length <= 7) return fetchSegment(waypoints, region)

  const segments = splitIntoSegments(waypoints, 7, breakIndices)
  const results = await Promise.all(segments.map((s) => fetchSegment(s, region)))

  // 앞 조각의 끝과 맞닿지 않은 조각은 첫 점을 버리면 안 된다.
  const detachedIndices = new Set(
    segments.flatMap((segment, index) => {
      if (index === 0) return []
      const previous = segments[index - 1]
      return segment[0] === previous[previous.length - 1] ? [] : [index]
    }),
  )

  return mergeRoadRoutes(results, detachedIndices)
}
