import type { Location } from '~features/location'

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

export interface LocationBoundaryDefinition {
  location: Location
  lat: number
  lng: number
}
