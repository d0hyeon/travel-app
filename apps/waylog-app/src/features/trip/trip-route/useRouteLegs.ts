import type { Coordinate } from '@waylog/domains/modules/map'
import type { RouteLeg } from '@waylog/domains/modules/route'
import { useMemo } from 'react'
import { useRoadRoute } from '../../route/road-route/useRoadRoute'

type Waypoint = Coordinate & { id: string }

// 경로의 방문 순서를 따라, 각 장소로 "들어오는" 이동 구간(leg)을 도착 장소 id로 조회할 수 있게 한다.
// 첫 장소는 이전 구간이 없으므로 Map에 포함되지 않는다.
export function useRouteLegs(waypoints: Waypoint[]): Map<string, RouteLeg> {
  const {
    data: { legs },
  } = useRoadRoute({ waypoints, suspense: false })

  return useMemo(() => {
    const legByArrivalPlaceId = new Map<string, RouteLeg>()

    waypoints.slice(1).forEach((waypoint, index) => {
      const leg = legs[index]
      if (leg) legByArrivalPlaceId.set(waypoint.id, leg)
    })

    return legByArrivalPlaceId
  }, [waypoints, legs])
}
