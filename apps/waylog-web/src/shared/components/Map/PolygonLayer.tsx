import { createContext, use } from 'react'
import { MapTypeContext } from './MapTypeContext'
import {
  GooglePolygonLayer,
  Polygon as GooglePolygon,
  Region as GoogleRegion,
} from './google/polygon-layer/GooglePolygonLayer'
import type {
  MapPolygonProps,
  MapRegionProps,
  PolygonLayerProps,
  PolygonStyleProps,
} from './polygon-layer.types'

export const PolygonLayerStyleContext = createContext<PolygonStyleProps | null>(null)

export function PolygonLayer({ children, color, opacity, strokeColor }: PolygonLayerProps) {
  const type = use(MapTypeContext)

  if (type !== 'google') return null

  return (
    <PolygonLayerStyleContext.Provider value={{ color, opacity, strokeColor }}>
      <GooglePolygonLayer>{children}</GooglePolygonLayer>
    </PolygonLayerStyleContext.Provider>
  )
}

export function Polygon(props: MapPolygonProps) {
  const type = use(MapTypeContext)
  const defaults = use(PolygonLayerStyleContext)

  if (type !== 'google') return null

  return (
    <GooglePolygon
      {...props}
      color={props.color ?? defaults?.color}
      opacity={props.opacity ?? defaults?.opacity}
      strokeColor={props.strokeColor ?? defaults?.strokeColor}
    />
  )
}

export function Region(props: MapRegionProps) {
  const type = use(MapTypeContext)
  const defaults = use(PolygonLayerStyleContext)

  if (type !== 'google') return null

  const styleProps = {
    color: props.color ?? defaults?.color,
    opacity: props.opacity ?? defaults?.opacity,
    strokeColor: props.strokeColor ?? defaults?.strokeColor,
  }

  if (props.location != null) {
    return (
      <GoogleRegion
        location={props.location}
        {...styleProps}
      />
    )
  }

  return <GoogleRegion country={props.country} {...styleProps} />
}
