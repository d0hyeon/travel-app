import type { Coordinate } from '@waylog/utility'

export interface CommunityTrip {
  communityKey: string
  destinations: string[]
  nights: number
  previewCoordinates: Coordinate[]
}

export interface CommunityRoute {
  dayNumber?: number
  places: CommunityPlace[]
}

export interface CommunityPlace {
  /** 마스터 places.id. 남의 여행 trip_places.id 가 아니다 — 내 여행에 담을 때 이 값을 쓴다 */
  placeId: string
  name: string
  address: string
  lat: number
  lng: number
}
