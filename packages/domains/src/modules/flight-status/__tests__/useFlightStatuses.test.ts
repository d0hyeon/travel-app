import { describe, expect, it } from 'vitest'
import { getIsQueryable } from '../useFlightStatuses'

const 인천출발 = {
  airlineCode: 'KE',
  flightNumber: '721',
  departureAirportCode: 'ICN',
  arrivalAirportCode: 'KIX',
  departureAt: '2026-03-01T09:10:00Z',
}

describe('getIsQueryable', () => {
  it('인천을 지나고 값이 다 찬 쿼리는 조회할 수 있다', () => {
    expect(getIsQueryable(인천출발)).toBe(true)
  })

  it('빈 쿼리는 조회할 곳이 없다', () => {
    expect(getIsQueryable({})).toBe(false)
  })

  it('인천을 지나지 않으면 조회할 곳이 없다', () => {
    expect(
      getIsQueryable({ ...인천출발, departureAirportCode: 'GMP', arrivalAirportCode: 'CJU' }),
    ).toBe(false)
  })

  it('편번호가 없으면 편을 특정할 수 없어 조회하지 않는다', () => {
    expect(getIsQueryable({ ...인천출발, flightNumber: undefined })).toBe(false)
  })
})
