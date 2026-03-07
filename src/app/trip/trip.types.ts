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
  /** 해외 여행 여부 (true: 해외, false: 국내) */
  isOverseas: boolean
}
