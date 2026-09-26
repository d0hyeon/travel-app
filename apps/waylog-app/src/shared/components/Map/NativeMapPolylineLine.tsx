import { useEffect, useId } from 'react'
import type { PolylineLineProps } from '@waylog/domains/modules/map'
import Mapbox from '@rnmapbox/maps'
import { StyleSheet, View } from 'react-native'
import { Typography } from '~/shared/components/design-system'
import { useMapContext } from './MapContext'
import { usePolylineStyle } from './PolylineContext'

const DEFAULT_STROKE_COLOR = '#4C84FF'
const DEFAULT_STROKE_WEIGHT = 4
const DEFAULT_STROKE_OPACITY = 1

// Polyline 그룹 안의 개별 구간. 부모가 전달한 공통 스타일로 선을 그리고,
// label이 있으면 좌표열 중앙에 텍스트를 얹는다.
export function NativeMapPolylineLine({ coordinates, label }: PolylineLineProps) {
  const { config, extendBound } = useMapContext()
  const style = usePolylineStyle()
  const sourceId = useId()

  useEffect(() => {
    if (config.autoFocus === 'path') coordinates.forEach((coord) => extendBound(coord))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coordinates])

  if (coordinates.length < 2) return null

  const strokeColor = style.strokeColor ?? DEFAULT_STROKE_COLOR
  const strokeWeight = style.strokeWeight ?? DEFAULT_STROKE_WEIGHT
  const strokeOpacity = style.strokeOpacity ?? DEFAULT_STROKE_OPACITY

  const lineGeojson: GeoJSON.Feature<GeoJSON.LineString> = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: coordinates.map((c) => [c.lng, c.lat]),
    },
  }

  const midCoord = coordinates[Math.floor(coordinates.length / 2)]

  return (
    <>
      <Mapbox.ShapeSource id={`polyline-line-${sourceId}`} shape={lineGeojson}>
        <Mapbox.LineLayer
          id={`polyline-line-layer-${sourceId}`}
          style={{
            lineColor: strokeColor,
            lineWidth: strokeWeight,
            lineOpacity: strokeOpacity,
            lineDasharray: toDashPattern(style.strokeStyle, strokeWeight),
            lineCap: 'round',
            lineJoin: 'round',
          }}
        />
      </Mapbox.ShapeSource>
      {label != null && (
        <Mapbox.MarkerView coordinate={[midCoord.lng, midCoord.lat]} anchor={{ x: 0.5, y: 0.5 }} allowOverlap>
          <View style={[styles.labelBubble, { backgroundColor: strokeColor }]}>
            <Typography numberOfLines={1} style={styles.labelText}>
              {label}
            </Typography>
          </View>
        </Mapbox.MarkerView>
      )}
    </>
  )
}

function toDashPattern(style: string | undefined, weight: number): number[] | undefined {
  if (style === 'dashed') return [weight * 3, weight * 2]
  if (style === 'dotted') return [weight, weight * 2]
  return undefined
}

const styles = StyleSheet.create({
  labelBubble: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  labelText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '900',
  },
})
