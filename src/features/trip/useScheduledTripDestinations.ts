import { useSuspenseQuery } from '@tanstack/react-query'
import { getAllTrips, tripKey } from './trip.api'
import { getTripStatus } from './trip-list/trip-list.utils'
import { isLocation } from '~features/location'
import type { Location } from '~features/location'

export function useScheduledTripDestinations(): Location[] {
  const { data: trips } = useSuspenseQuery({
    queryKey: [tripKey],
    queryFn: getAllTrips,
  })

  const scheduled =
    trips.find((trip) => getTripStatus(trip.startDate, trip.endDate) === 'ongoing') ??
    trips.find((trip) => getTripStatus(trip.startDate, trip.endDate) === 'upcoming')

  if (!scheduled) return []

  return scheduled.destinations.filter(isLocation)
}
