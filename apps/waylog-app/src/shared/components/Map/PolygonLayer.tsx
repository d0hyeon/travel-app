import { createContext, use, useEffect, useState } from 'react'
import type {
  MapPolygonProps,
  MapRegionProps,
  PolygonLayerProps,
  PolygonStyleProps,
} from '@waylog/domains/modules/map'
import { getCountryPolygonCoordinateGroups, getLocationCoordinates } from '@waylog/domains/modules/map'
import type { Coordinate } from '@waylog/utility'
import Mapbox from '@rnmapbox/maps'

const PolygonLayerStyleContext = createContext<PolygonStyleProps | null>(null)

export function PolygonLayer({ children, color, opacity, strokeColor }: PolygonLayerProps) {
  return (
    <PolygonLayerStyleContext value={{ color, opacity, strokeColor }}>
      {children}
    </PolygonLayerStyleContext>
  )
}

export function Polygon(props: MapPolygonProps) {
  const defaults = use(PolygonLayerStyleContext)
  const color = props.color ?? defaults?.color ?? '#4C84FF'
  const opacity = props.opacity ?? defaults?.opacity ?? 0.3
  const strokeColor = props.strokeColor ?? defaults?.strokeColor ?? color

  const geojson: GeoJSON.Feature<GeoJSON.Polygon> = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: props.coordinates
        .filter((ring) => ring.length >= 3)
        .map((ring) => closePolygon(ring).map((c) => [c.lng, c.lat])),
    },
  }

  return (
    <Mapbox.ShapeSource id={`polygon-${JSON.stringify(props.coordinates[0]?.[0])}`} shape={geojson}>
      <Mapbox.FillLayer
        id="polygon-fill"
        style={{ fillColor: color, fillOpacity: opacity, fillOutlineColor: strokeColor }}
      />
    </Mapbox.ShapeSource>
  )
}

export function Region(props: MapRegionProps) {
  const [coordinateGroups, setCoordinateGroups] = useState<Coordinate[][][] | null>(null)
  // 무엇을 그릴지는 이 둘만 정한다. 색·투명도가 바뀌었다고 다시 받지 않는다.
  const country = props.country
  const location = props.location

  useEffect(() => {
    let mounted = true
    setCoordinateGroups(null)

    async function load() {
      if (country != null) {
        const coordinates = await getCountryPolygonCoordinateGroups(country)
        if (mounted) setCoordinateGroups(coordinates)
        return
      }

      if (location == null) return

      const coordinates = await getLocationCoordinates({ location })
      if (mounted) setCoordinateGroups(coordinates ? [coordinates] : [])
    }

    // 경계 파일이 없는 나라가 있다. 그리지 않을 뿐 오류가 아니다.
    load().catch(() => {
      if (mounted) setCoordinateGroups([])
    })

    return () => {
      mounted = false
    }
  }, [country, location])

  if (!coordinateGroups?.length) return null

  return (
    <>
      {coordinateGroups.map((coordinates, index) => (
        <Polygon
          key={`${props.country ?? String(props.location)}-${index}`}
          coordinates={coordinates}
          color={props.color}
          opacity={props.opacity}
          strokeColor={props.strokeColor}
        />
      ))}
    </>
  )
}

function closePolygon(coordinates: Coordinate[]) {
  if (coordinates.length === 0) return coordinates
  const first = coordinates[0]
  const last = coordinates[coordinates.length - 1]
  if (!first || !last) return coordinates
  if (first.lat === last.lat && first.lng === last.lng) return coordinates
  return [...coordinates, first]
}
