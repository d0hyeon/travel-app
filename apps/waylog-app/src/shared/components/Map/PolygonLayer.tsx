import { createContext, use, useEffect, useState } from 'react'
import type {
  MapPolygonProps,
  MapRegionProps,
  PolygonLayerProps,
  PolygonStyleProps,
} from '@waylog/domains/modules/map'
import {
  getCountryPolygonCoordinateGroups,
  getLocationCoordinates,
  getRegionPolygonPaint,
  type RegionPolygonPaint,
} from '@waylog/domains/modules/map'
import type { Coordinate } from '@waylog/utility'
import Mapbox from '@rnmapbox/maps'
import { useMapContext } from './MapContext'

const PolygonLayerStyleContext = createContext<PolygonStyleProps | null>(null)

export function PolygonLayer({ children, color, opacity, strokeColor }: PolygonLayerProps) {
  return (
    <PolygonLayerStyleContext value={{ color, opacity, strokeColor }}>
      {children}
    </PolygonLayerStyleContext>
  )
}

export function Polygon(props: MapPolygonProps & { id?: string; paint?: RegionPolygonPaint }) {
  const defaults = use(PolygonLayerStyleContext)
  const color = props.color ?? defaults?.color ?? '#4C84FF'
  const strokeColor = props.strokeColor ?? defaults?.strokeColor ?? color
  const paint = props.paint
  const fillOpacity = paint?.fillOpacity ?? props.opacity ?? defaults?.opacity ?? 0.3

  const rings = props.coordinates.filter((ring) => ring.length >= 3)
  if (rings.length === 0) return null

  const geojson: GeoJSON.Feature<GeoJSON.Polygon> = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: rings.map((ring) => closePolygon(ring).map((c) => [c.lng, c.lat])),
    },
  }

  // Mapbox 는 소스와 레이어 id 가 겹치면 하나만 남기고 버린다.
  // 좌표는 재료로 못 쓴다 — 인터라켄이 베른 주 경계로 해석되듯,
  // 서로 다른 지역이 같은 경계를 가리키면 같은 좌표가 나온다.
  const sourceId = props.id ?? `polygon-${JSON.stringify(rings[0]?.[0] ?? {})}`

  return (
    <Mapbox.ShapeSource id={sourceId} shape={geojson}>
      <Mapbox.FillLayer
        id={`${sourceId}-fill`}
        style={{
          fillColor: color,
          // 옅어져도 레이어를 없애지 않는다. 붙였다 떼면 네이티브 등록이 어긋난다.
          fillOpacity: paint?.isVisible === false ? 0 : fillOpacity,
          fillSortKey: paint?.sortKey,
        }}
      />
      <Mapbox.LineLayer
        id={`${sourceId}-line`}
        style={{
          lineColor: strokeColor,
          lineOpacity: paint?.isVisible === false ? 0 : (paint?.lineOpacity ?? 0),
          lineWidth: paint?.lineWidth ?? 1,
          lineSortKey: paint?.sortKey,
        }}
      />
    </Mapbox.ShapeSource>
  )
}

export function Region(props: MapRegionProps) {
  const [coordinateGroups, setCoordinateGroups] = useState<Coordinate[][][] | null>(null)
  // 무엇을 그릴지는 이 둘만 정한다. 색·투명도가 바뀌었다고 다시 받지 않는다.
  const country = props.country
  const location = props.location
  const level = props.level
  const { zoom } = useMapContext()

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

      const coordinates = await getLocationCoordinates({ location, level })
      if (mounted) setCoordinateGroups(coordinates ? [coordinates] : [])
    }

    // 경계 파일이 없는 나라가 있다. 그리지 않을 뿐 오류가 아니다.
    load().catch(() => {
      if (mounted) setCoordinateGroups([])
    })

    return () => {
      mounted = false
    }
  }, [country, location, level])

  if (!coordinateGroups?.length) return null

  // 웹과 같이 줌에 따라 나라와 지역의 진하기를 교차시키고, 지역을 위에 올린다.
  const regionId = `region-${country ?? String(location)}`
  const paint = getRegionPolygonPaint({
    kind: country != null ? 'country' : 'region',
    zoom,
    opacity: props.opacity ?? 1,
  })

  return (
    <>
      {coordinateGroups.map((coordinates, index) => (
        <Polygon
          key={`${regionId}-${index}`}
          id={`${regionId}-${index}`}
          coordinates={coordinates}
          color={props.color}
          strokeColor={props.strokeColor}
          paint={paint}
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
