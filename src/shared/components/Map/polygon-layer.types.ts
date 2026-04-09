import type { ReactElement, ReactNode } from 'react'
import type { Country, Location } from '~features/location'
import type { Coordinate } from './types'

export interface PolygonStyleProps {
  color?: string
  opacity?: number
  strokeColor?: string
}

export type MapPolygonProps = PolygonStyleProps & {
  coordinates: Coordinate[][]
}

export type MapRegionProps =
  | (PolygonStyleProps & {
      country: Country
      location?: never
    })
  | (PolygonStyleProps & {
      location: Location
      country?: never
    })

export interface PolygonLayerProps extends PolygonStyleProps {
  children?: ReactNode
}

export type PolygonElement = ReactElement<MapPolygonProps>
export type RegionElement = ReactElement<MapRegionProps>

export type RegionLayerProps = PolygonLayerProps
