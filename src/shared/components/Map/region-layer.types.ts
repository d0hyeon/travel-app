import type { ReactElement, ReactNode } from 'react'
import type { Country, Location } from '~features/location'

interface BaseRegionProps {
      color: string
  opacity?: number
  strokeColor?: string
}

export type MapRegionProps =
  | (BaseRegionProps & {
      country: Country
      location?: never
      lat?: never
      lng?: never
    })
  | (BaseRegionProps & {
      location: Location
      country?: never
      lat: number
      lng: number
    })

export interface RegionLayerProps {
  children?: ReactNode
}

export type RegionElement = ReactElement<MapRegionProps>

export interface CountryRegionDefinition {
  type: 'country'
  country: Country
  color: string
  opacity?: number
  strokeColor?: string
}

export interface LocationRegionDefinition {
  type: 'region'
  location: Location
  lat: number
  lng: number
  color: string
  opacity?: number
  strokeColor?: string
}

export type RegionDefinition = CountryRegionDefinition | LocationRegionDefinition
