import {
  dedupeNearbyPoints,
  getCoordinateBounds,
  normalizeCoordsToCanvas,
  pointsToPath,
  type PreviewRoute,
} from '@waylog/domains/modules/community-route'
import { isLocation } from '@waylog/domains/modules/location'
import { getCachedLocationCoordinates } from '@waylog/domains/modules/map'
import Svg, { Circle, Path, Rect } from 'react-native-svg'

const DOT_COLOR = '#1976d2'
const SHAPE_FILL = '#dde8f0'
const SHAPE_STROKE = '#b0c8d8'

interface Props {
  destinations: string[]
  previewRoutes: PreviewRoute[]
  width?: number
  height?: number
}

/**
 * 웹 CommunityRouteThumbnail 과 같은 그림이다.
 *
 * 다만 지역 shape 는 이미 받아둔 경계가 있을 때만 그린다. 목록의 행마다
 * 나라별 수 MB 짜리 geojson 을 받으면 스크롤이 멈추기 때문이다.
 * 기록탭이 먼저 받아두면 그 캐시를 그대로 쓴다.
 */
export function CommunityRouteThumbnail({
  destinations,
  previewRoutes,
  width = 140,
  height = 90,
}: Props) {
  const shapeRings = getCachedShapeRings(destinations)
  const routeCoords = previewRoutes.flatMap((route) => route.coords)
  const allCoords = [...shapeRings.flat(), ...routeCoords]

  if (allCoords.length === 0) {
    return (
      <Svg width={width} height={height}>
        <Rect width={width} height={height} fill="#f5f5f5" rx={4} />
      </Svg>
    )
  }

  const bounds = getCoordinateBounds(allCoords)
  const canvas = { width, height, padding: 6 }
  const toCanvas = (coords: typeof allCoords) => normalizeCoordsToCanvas(coords, bounds, canvas)
  const dots = dedupeNearbyPoints(toCanvas(routeCoords))

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Rect width={width} height={height} fill="#f0f4f8" />
      {shapeRings.map((ring, index) => (
        <Path
          key={index}
          d={pointsToPath(toCanvas(ring))}
          fill={SHAPE_FILL}
          stroke={SHAPE_STROKE}
          strokeWidth={0.8}
          strokeLinejoin="round"
        />
      ))}
      {dots.map((dot, index) => (
        <Circle
          key={index}
          cx={dot.x}
          cy={dot.y}
          r={3.5}
          fill="#fff"
          stroke={DOT_COLOR}
          strokeWidth={1.5}
          opacity={0.9}
        />
      ))}
    </Svg>
  )
}

function getCachedShapeRings(destinations: string[]) {
  const location = destinations.find(isLocation)
  if (!location) return []

  return getCachedLocationCoordinates(location) ?? []
}
