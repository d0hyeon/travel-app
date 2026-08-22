import {
  dedupeNearbyPoints,
  getCoordinateBounds,
  normalizeCoordsToCanvas,
  type PreviewRoute,
} from '@waylog/domains/modules/community-route'
import Svg, { Circle, Rect } from 'react-native-svg'

const DOT_COLOR = '#1976d2'

interface Props {
  destinations: string[]
  previewRoutes: PreviewRoute[]
  width?: number
  height?: number
}

/**
 * 웹 CommunityRouteThumbnail 과 같은 그림이다.
 *
 * 다만 지역 shape 배경은 그리지 않는다. 웹은 /visit-layer/*.geojson 정적 파일을
 * 받아 폴리곤을 그리는데 앱에는 그 파일도, 상대 URL 을 받을 방법도 없다.
 * 경로 도트는 previewRoutes 에서 오므로 그대로 나온다.
 */
export function CommunityRouteThumbnail({
  previewRoutes,
  width = 140,
  height = 90,
}: Props) {
  const routeCoords = previewRoutes.flatMap((route) => route.coords)

  if (routeCoords.length === 0) {
    return (
      <Svg width={width} height={height}>
        <Rect width={width} height={height} fill="#f5f5f5" rx={4} />
      </Svg>
    )
  }

  const bounds = getCoordinateBounds(routeCoords)
  const dots = dedupeNearbyPoints(
    normalizeCoordsToCanvas(routeCoords, bounds, { width, height, padding: 6 }),
  )

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Rect width={width} height={height} fill="#f0f4f8" />
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
