export type {
  MapPolygonProps,
  MapRegionProps,
  PolygonElement,
  PolygonLayerProps,
  PolygonStyleProps as RegionStyleProps,
  RegionElement,
  RegionLayerProps,
} from './polygon-layer.types'

export interface CountryRegionDefinition {
  type: 'country'
  country: import('~features/location').Country
  color?: string
  opacity?: number
  strokeColor?: string
}

export interface LocationRegionDefinition {
  type: 'region'
  location: import('~features/location').Location
  lat: number
  lng: number
  color?: string
  opacity?: number
  strokeColor?: string
}

export type RegionDefinition = CountryRegionDefinition | LocationRegionDefinition
