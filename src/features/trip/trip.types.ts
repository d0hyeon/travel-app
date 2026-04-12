import type { ExchangeRateEntry } from '../expense/currency'

export interface Trip {
  id: string
  userId: string | null
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
  /** @deprecated exchangeRates 사용 */
  exchangeRate: number | null
  /** 통화별 환율 배열 (1 외화 = X원) */
  exchangeRates: ExchangeRateEntry[] | null
}
