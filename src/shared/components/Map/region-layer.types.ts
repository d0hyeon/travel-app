import type { ReactElement, ReactNode } from 'react'
import type { CountryName, DestinationName } from '~shared/utils/location'

interface BaseRegionProps {
  color: string
  opacity?: number
  strokeColor?: string
}

export type MapRegionProps =
  | (BaseRegionProps & {
      country: CountryName
      region?: never
      lat?: never
      lng?: never
    })
  | (BaseRegionProps & {
      region: DestinationName
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
  country: CountryName
  color: string
  opacity?: number
  strokeColor?: string
}

export interface DestinationRegionDefinition {
  type: 'region'
  region: DestinationName
  lat: number
  lng: number
  color: string
  opacity?: number
  strokeColor?: string
}

export type RegionDefinition = CountryRegionDefinition | DestinationRegionDefinition
