import { describe, expect, it } from 'vitest'
import { Country } from '@waylog/domains/modules/location'
import type { Trip } from '@waylog/domains/modules/trip'
import { deriveVisitedCountries } from '../user-profile.utils'

function createTrip(destinations: string[]): Trip {
  return { id: destinations.join('-'), destinations, endDate: '2026-01-01' } as unknown as Trip
}

describe('deriveVisitedCountries', () => {
  it('나라별로 방문한 여행 수를 센다', () => {
    const counts = deriveVisitedCountries([createTrip(['도쿄']), createTrip(['오사카'])])

    expect(counts.get(Country.일본)).toBe(2)
  })

  it('한 여행이 같은 나라의 여러 도시를 거쳐도 1로 센다', () => {
    const counts = deriveVisitedCountries([createTrip(['도쿄', '오사카'])])

    expect(counts.get(Country.일본)).toBe(1)
  })

  it('한 여행이 여러 나라를 거치면 각 나라에 1씩 센다', () => {
    const counts = deriveVisitedCountries([createTrip(['도쿄', '파리'])])

    expect(counts.get(Country.일본)).toBe(1)
    expect(counts.get(Country.프랑스)).toBe(1)
  })

  it('나라를 알 수 없는 목적지는 세지 않는다', () => {
    const counts = deriveVisitedCountries([createTrip(['알수없는곳'])])

    expect(counts.size).toBe(0)
  })
})
