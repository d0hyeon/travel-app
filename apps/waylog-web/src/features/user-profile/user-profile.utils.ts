import type { Coordinate } from '@waylog/domains/utils'
import { Country } from '@waylog/domains/location'
import type { Location } from '@waylog/domains/location'
import {
  getCoordinateByLocation,
  getCountryByLocation,
  getCountryNameByLocation,
  isLocation,
} from '@waylog/domains/location'
import type { Trip } from '@waylog/domains/trip'

export interface VisitedLocation {
  location: Location
  countryCode: Country | undefined
  countryName: string
  coordinate: Coordinate
  visitCount: number
  lastVisitedAt: string
  trips: Trip[]
}

/**
 * 사용자의 trip 목록을 location 단위로 집계한다.
 * destinations vocabulary에 없는 자유 입력은 제외 (좌표를 알 수 없음).
 */
export function deriveVisitedLocations(trips: Trip[]): VisitedLocation[] {
  const aggregated = new Map<Location, VisitedLocation>()

  for (const trip of trips) {
    
    for (const dest of trip.destinations) {
      if (!isLocation(dest)) continue

      const existing = aggregated.get(dest)
      if (existing) {
        existing.visitCount += 1
        existing.trips.push(trip)
        if (trip.endDate > existing.lastVisitedAt) {
          existing.lastVisitedAt = trip.endDate
        }
      } else {
        aggregated.set(dest, {
          location: dest,
          countryCode: getCountryByLocation(dest),
          countryName: getCountryNameByLocation(dest),
          coordinate: getCoordinateByLocation(dest),
          visitCount: 1,
          lastVisitedAt: trip.endDate,
          trips: [trip],
        })
      }
    }
  }

  return [...aggregated.values()].toSorted((a, b) => b.visitCount - a.visitCount)
}

/**
 * 사용자 trip의 destinations 전체에서 unique 국가 수를 센다.
 */
export function countUniqueCountries(trips: Trip[]): number {
  const countries = new Set<Country>()
  for (const trip of trips) {
    for (const dest of trip.destinations) {
      const country = getCountryByLocation(dest)
      if (country) countries.add(country)
    }
  }
  return countries.size
}

/**
 * 국가 단위 방문 trip 수 집계 (한 trip이 여러 국가를 방문하면 각 국가에 1씩).
 */
export function deriveVisitedCountries(trips: Trip[]): Map<Country, number> {
  const map = new Map<Country, number>()
  for (const trip of trips) {
    const countries = new Set<Country>()
    for (const dest of trip.destinations) {
      const country = getCountryByLocation(dest)
      if (country) countries.add(country)
    }
    countries.forEach((country) => {
      map.set(country, (map.get(country) ?? 0) + 1)
    })
  }
  return map
}

