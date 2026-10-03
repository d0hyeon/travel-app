import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { koreaAirportsFlightStatusProvider } from '../koreaAirportsFlightStatus.provider'

describe('koreaAirportsFlightStatusProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-03T12:00:00+09:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('어제부터 6일 뒤까지 조회할 수 있다', () => {
    expect(koreaAirportsFlightStatusProvider.getIsAvailability('2026-10-02T09:00:00+09:00')).toBe(true)
    expect(koreaAirportsFlightStatusProvider.getIsAvailability('2026-10-09T23:00:00+09:00')).toBe(true)
  })

  it('3일 전보다 오래된 편과 7일 뒤의 편은 조회할 수 없다', () => {
    expect(koreaAirportsFlightStatusProvider.getIsAvailability('2026-09-29T23:00:00+09:00')).toBe(false)
    expect(koreaAirportsFlightStatusProvider.getIsAvailability('2026-10-10T00:00:00+09:00')).toBe(false)
  })

  it('지원 공항에는 김포와 제주가 있고 인천은 없다', () => {
    expect(koreaAirportsFlightStatusProvider.supportedAirportCodes).toContain('GMP')
    expect(koreaAirportsFlightStatusProvider.supportedAirportCodes).toContain('CJU')
    expect(koreaAirportsFlightStatusProvider.supportedAirportCodes).not.toContain('ICN')
  })
})
