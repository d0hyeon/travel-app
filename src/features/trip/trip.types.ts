import type { ExchangeRateEntry } from '../expense/currency'

export interface Trip {
  id: string
  userId: string | null
  name: string
  /** 여행 목적지 목록 (순서 있음, 첫 번째가 대표 목적지) */
  destinations: string[]
  /** 대표 좌표 (첫 번째 목적지 기준) */
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
