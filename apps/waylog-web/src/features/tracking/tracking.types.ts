export interface LocationLog {
  id: string
  tripId: string
  lat: number
  lng: number
  stayDurationMinutes: number
  isPlanned: boolean // 계획된 장소인지
  timestamp: string // ISO datetime
}

export interface TrackedRoute {
  id: string
  tripId: string
  coordinates: { lat: number; lng: number; timestamp: string }[]
  isPlanned: boolean
  createdAt: string
}
