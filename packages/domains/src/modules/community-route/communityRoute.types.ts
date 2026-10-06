import type { Coordinate } from '@waylog/utility'

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
  /** 마스터 places.id. 남의 여행 trip_places.id 가 아니다 — 내 여행에 담을 때 이 값을 쓴다 */
  placeId: string
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
