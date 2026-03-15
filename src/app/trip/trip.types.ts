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
  /** 환율 (1 외화 = X원). 해외 여행일 때만 사용 */
  exchangeRate: number | null
}
