import { useEffect, useId } from 'react'
import type { PathProps } from '@waylog/domains/modules/map'
import Mapbox from '@rnmapbox/maps'
import { useMapContext } from './MapContext'

export function NativeMapPath({
  coordinates,
  strokeColor = '#4C84FF',
  strokeWeight = 4,
  strokeOpacity = 1,
  strokeStyle,
}: PathProps) {
  // 부모가 자식 트리를 스캔하는 대신, 마운트 시점에 스스로 좌표를 등록한다.
  const { config, extendBound } = useMapContext()
  const sourceId = useId()

  useEffect(() => {
    if (config.autoFocus === 'path') coordinates.forEach((coord) => extendBound(coord))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coordinates])

  // 경로는 점이 둘 이상이어야 그려진다.
  if (coordinates.length < 2) return null

  const geojson: GeoJSON.Feature<GeoJSON.LineString> = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: coordinates.map((c) => [c.lng, c.lat]),
    },
  }

  return (
    <Mapbox.ShapeSource id={`path-${sourceId}`} shape={geojson}>
      <Mapbox.LineLayer
        id={`path-line-${sourceId}`}
        style={{
          lineColor: strokeColor,
          lineWidth: strokeWeight,
          lineOpacity: strokeOpacity,
          // 웹의 dashed/dotted 를 점선 간격으로 옮긴다.
          lineDasharray: toDashPattern(strokeStyle, strokeWeight),
          lineCap: 'round',
          lineJoin: 'round',
        }}
      />
    </Mapbox.ShapeSource>
  )
}

function toDashPattern(style: string | undefined, weight: number): number[] | undefined {
  if (style === 'dashed') return [weight * 3, weight * 2]
  if (style === 'dotted') return [weight, weight * 2]
  return undefined
}
