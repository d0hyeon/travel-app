import { useEffect, useState } from 'react'
import { getLocationCoordinates } from '~shared/components/Map/polygon-layer.utils'
import { Locations, type Location } from '@waylog/domains/location'
import type { Coordinate } from '@waylog/domains/utils'
import type { PreviewRoute } from '@waylog/domains/community-route'
import {
  dedupeNearbyPoints,
  getCoordinateBounds,
  normalizeCoordsToCanvas,
  pointsToPath,
} from '@waylog/domains/community-route'

const DOT_COLOR = '#1976d2'

interface Props {
  destinations: string[]
  previewRoutes: PreviewRoute[]
  width?: number
  height?: number
}


export function CommunityRouteThumbnail({
  destinations,
  previewRoutes,
  width = 140,
  height = 90,
}: Props) {
  const [shapeRings, setShapeRings] = useState<Coordinate[][]>([])

  useEffect(() => {
    const validLocation = destinations.find((d): d is Location =>
      Locations.includes(d as Location)
    )
    if (!validLocation) return

    let cancelled = false
    getLocationCoordinates({ location: validLocation }).then((rings) => {
      if (!cancelled && rings) setShapeRings(rings)
    })
    return () => { cancelled = true }
  }, [destinations])

  const routeCoords = previewRoutes.flatMap((r) => r.coords)
  const allCoords = [...shapeRings.flat(), ...routeCoords]

  if (allCoords.length === 0) {
    return (
      <svg width={width} height={height} style={{ display: 'block' }}>
        <rect width={width} height={height} fill="#f5f5f5" rx={4} />
      </svg>
    )
  }

  const bounds = getCoordinateBounds(allCoords)
  const size = { width, height, padding: 6 }

  const toSVG = (coords: Coordinate[]) => normalizeCoordsToCanvas(coords, bounds, size)

  const dedupedDots = dedupeNearbyPoints(toSVG(routeCoords))

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ display: 'block', borderRadius: 4, overflow: 'hidden' }}
    >
      {/* 배경 */}
      <rect width={width} height={height} fill="#f0f4f8" />

      {/* 지역 shape */}
      {shapeRings.map((ring, i) => (
        <path
          key={i}
          d={pointsToPath(toSVG(ring))}
          fill="#dde8f0"
          stroke="#b0c8d8"
          strokeWidth={0.8}
          strokeLinejoin="round"
        />
      ))}

      {/* 장소 도트 */}
      {dedupedDots.map((pt, i) => (
        <circle key={i} cx={pt.x} cy={pt.y} r={3.5} fill="#fff" stroke={DOT_COLOR} strokeWidth={1.5} opacity={0.9} />
      ))}
    </svg>
  )
}
