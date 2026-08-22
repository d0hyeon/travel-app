import { supabase } from '../../client'
import { TransportType } from './route.types'
import type { RoadRoute } from './route.types'
import type { Coordinate } from '../utils'
import { splitIntoSegments } from './roadRoute.utils'

function mergeRoadRoutes(routes: RoadRoute[]): RoadRoute {
  if (routes.length === 0) return { coordinates: [], legs: [] }
  return routes.reduce((merged, route) => ({
    coordinates: [...merged.coordinates, ...route.coordinates.slice(1)],
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

export async function getRoadDirections(waypoints: Coordinate[], region: 'korea' | 'global'): Promise<RoadRoute> {
  if (waypoints.length < 2) return fallbackRoadRoute(waypoints)
  if (waypoints.length <= 7) return fetchSegment(waypoints, region)

  const segments = splitIntoSegments(waypoints, 7)
  const results = await Promise.all(segments.map((s) => fetchSegment(s, region)))
  return mergeRoadRoutes(results)
}
