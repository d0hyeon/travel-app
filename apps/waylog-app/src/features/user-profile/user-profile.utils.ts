import type { Coordinate } from '@waylog/utility'
import {
  Country,
  getCoordinateByLocation,
  getCountryByLocation,
  getCountryNameByLocation,
  isLocation,
  type Location,
} from '@waylog/domains/modules/location'
import type { Trip } from '@waylog/domains/modules/trip'

export interface VisitedLocation {
  location: Location
  countryCode: Country | undefined
  countryName: string
  coordinate: Coordinate
  visitCount: number
  lastVisitedAt: string
  trips: Trip[]
}

export function deriveVisitedLocations(trips: Trip[]): VisitedLocation[] {
  const aggregatedLocations = new Map<Location, VisitedLocation>()

  trips.forEach((trip) => {
    trip.destinations.forEach((destination) => {
      if (!isLocation(destination)) return

      const existingLocation = aggregatedLocations.get(destination)
      if (existingLocation == null) {
        aggregatedLocations.set(destination, {
          location: destination,
          countryCode: getCountryByLocation(destination),
          countryName: getCountryNameByLocation(destination),
          coordinate: getCoordinateByLocation(destination),
          visitCount: 1,
          lastVisitedAt: trip.endDate,
          trips: [trip],
        })
        return
      }

      existingLocation.visitCount += 1
      existingLocation.trips.push(trip)
      if (trip.endDate > existingLocation.lastVisitedAt) existingLocation.lastVisitedAt = trip.endDate
    })
  })

  return [...aggregatedLocations.values()].toSorted((first, second) => second.visitCount - first.visitCount)
}

export function countUniqueCountries(trips: Trip[]): number {
  const countries = new Set<Country>()
  trips.forEach((trip) => {
    trip.destinations.forEach((destination) => {
      const country = getCountryByLocation(destination)
      if (country != null) countries.add(country)
    })
  })
  return countries.size
}
