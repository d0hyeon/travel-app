import { useEffect, useState } from 'react'
import { getLocationCoordinates } from '~shared/components/Map/polygon-layer.utils'
import { Locations, type Location } from '~features/location'
import type { Coordinate } from '~shared/model/coordinate.model'
import type { PreviewRoute } from './communityRoute.types'

const DOT_COLOR = '#1976d2'

interface Props {
  destinations: string[]
  previewRoutes: PreviewRoute[]
  width?: number
  height?: number
}

interface NormalizedPoint {
  x: number
  y: number
}

function normalizeCoordsToSVG(
  coords: Coordinate[],
  minLng: number,
  maxLng: number,
  minLat: number,
  maxLat: number,
  width: number,
  height: number,
  padding: number,
): NormalizedPoint[] {
  const lngRange = maxLng - minLng || 1
  const latRange = maxLat - minLat || 1
  const w = width - padding * 2
  const h = height - padding * 2

  return coords.map(({ lat, lng }) => ({
    x: padding + ((lng - minLng) / lngRange) * w,
    y: padding + ((maxLat - lat) / latRange) * h,
  }))
}

function pointsToPath(points: NormalizedPoint[]): string {
  if (points.length === 0) return ''
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ') + ' Z'
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

  if (routeCoords.length === 0 && shapeRings.length === 0) {
    return (
      <svg width={width} height={height} style={{ display: 'block' }}>
        <rect width={width} height={height} fill="#f5f5f5" rx={4} />
      </svg>
    )
  }

  // bounds는 장소 좌표 기준 — shapeRings로 넓히면 도트가 좁은 영역에 몰려 사라짐
  const boundsSource = routeCoords.length > 0 ? routeCoords : shapeRings.flat()

  const padding = 6
  const minLng = Math.min(...boundsSource.map((c) => c.lng))
  const maxLng = Math.max(...boundsSource.map((c) => c.lng))
  const minLat = Math.min(...boundsSource.map((c) => c.lat))
  const maxLat = Math.max(...boundsSource.map((c) => c.lat))

  const toSVG = (coords: Coordinate[]) =>
    normalizeCoordsToSVG(coords, minLng, maxLng, minLat, maxLat, width, height, padding)

  const allDots = toSVG(routeCoords)
  const dedupedDots = allDots.filter((pt, idx) => {
    for (let i = 0; i < idx; i++) {
      const prev = allDots[i]!
      if (Math.hypot(pt.x - prev.x, pt.y - prev.y) < 7) return false
    }
    return true
  })

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
