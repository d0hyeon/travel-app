import type { Coordinate } from '@waylog/domains/utils'

export interface PreviewRoute {
  scheduledDate?: string
  coords: Coordinate[]
}

export interface CommunityTrip {
  id: string
  destinations: string[]
  startDate: string
  endDate: string
  routeCount: number
  memberCount: number
  previewRoutes: PreviewRoute[]
}

export interface CommunityPlace {
  id: string
  name: string
  address: string
  lat: number
  lng: number
  order: number
}

export interface CommunityRouteWithPlaces {
  id: string
  name: string
  scheduledDate?: string
  places: CommunityPlace[]
}
