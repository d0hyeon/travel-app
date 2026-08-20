import type { Coordinate } from '@waylog/domains/map'
import { Map } from '../../../../shared/components/Map'
import { useRoadRoute } from '../../../route/road-route/useRoadRoute'

interface RoutePathProps {
  waypoints: Coordinate[]
  color: string
  isSelected: boolean
}

// 경로를 구간(leg)별 폴리라인으로 그린다.
// 웹은 구간마다 이동수단·시간 라벨을 얹지만 RN 폴리라인에는 라벨이 없다.
export function RoutePath({ waypoints, color, isSelected }: RoutePathProps) {
  const {
    data: { legs },
  } = useRoadRoute({ waypoints, suspense: false })

  if (legs.length === 0) return null

  return (
    <>
      {legs.map((leg, index) => (
        <Map.Path
          key={index}
          coordinates={leg.coordinates}
          strokeColor={color}
          strokeWeight={isSelected ? 5 : 3}
          strokeOpacity={isSelected ? 1 : 0.6}
        />
      ))}
    </>
  )
}
