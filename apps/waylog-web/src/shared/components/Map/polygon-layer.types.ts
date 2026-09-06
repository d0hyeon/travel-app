import type { ReactElement } from 'react'
import type { MapPolygonProps, MapRegionProps } from '@waylog/domains/modules/map'

export type {
  PolygonStyleProps,
  MapPolygonProps,
  MapRegionProps,
  PolygonLayerProps,
  RegionLayerProps,
} from '@waylog/domains/modules/map'

export type PolygonElement = ReactElement<MapPolygonProps>
export type RegionElement = ReactElement<MapRegionProps>
