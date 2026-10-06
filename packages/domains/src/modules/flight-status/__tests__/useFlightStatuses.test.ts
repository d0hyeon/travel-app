import { describe, expect, it } from 'vitest'
import { getIsQueryable } from '../useFlightStatuses'

const 인천출발 = {
  transportId: 'transport-1',
  airlineCode: 'KE',
  flightNumber: '721',
  departureAirportCode: 'ICN',
  departureAt: '2026-03-01T09:10:00Z',
}

describe('getIsQueryable', () => {
  it('인천에서 출발하고 값이 다 찬 쿼리는 조회할 수 있다', () => {
    expect(getIsQueryable(인천출발)).toBe(true)
  })

  it('빈 쿼리는 조회할 곳이 없다', () => {
    expect(getIsQueryable({})).toBe(false)
  })

  it('한국공항공사 소관 공항에서 출발해도 조회할 수 있다', () => {
    expect(getIsQueryable({ ...인천출발, departureAirportCode: 'GMP' })).toBe(true)
  })

  it('지원하지 않는 공항에서 출발하면 조회할 곳이 없다', () => {
    expect(getIsQueryable({ ...인천출발, departureAirportCode: 'NRT' })).toBe(false)
  })

  it('인천 도착편은 조회할 수 없다', () => {
    expect(
      getIsQueryable({ ...인천출발, departureAirportCode: 'KIX' }),
    ).toBe(false)
  })

  it('교통편 id 가 없으면 상태 행을 찾을 수 없어 조회하지 않는다', () => {
    expect(getIsQueryable({ ...인천출발, transportId: undefined })).toBe(false)
  })

  it('편번호가 없으면 편을 특정할 수 없어 조회하지 않는다', () => {
    expect(getIsQueryable({ ...인천출발, flightNumber: undefined })).toBe(false)
  })
})
