import type { Country } from '~features/location'

export type GeoJsonGeometry = {
  type: 'Polygon' | 'MultiPolygon'
  coordinates: number[][][] | number[][][][]
}

export type GeoJsonFeature = {
  type: 'Feature'
  properties: Record<string, unknown>
  geometry: GeoJsonGeometry | null
}

export type GeoJsonFeatureCollection = {
  type: 'FeatureCollection'
  features: GeoJsonFeature[]
}

export interface RegionStyleDefinition {
  color: string
  opacity?: number
  strokeColor?: string
}

export interface CountryFeatureProperties extends RegionStyleDefinition {
  layerType: 'country'
  country: Country
}

export interface RegionFeatureProperties extends RegionStyleDefinition {
  layerType: 'region'
  region: string
}
