export interface Trip {
  id: string
  name: string
  destination: string
  lat: number
  lng: number
  startDate: string // ISO date
  endDate: string
  shareLink: string
  createdAt: string
}
