import { useSuspenseQuery } from '@waylog/react'
import { getAllTrips, getTripStatus, tripKey } from '@waylog/domains/modules/trip'

export function useScheduledTrips() {
  return useSuspenseQuery({
    queryKey: [tripKey],
    queryFn: getAllTrips,
    select: (trips) =>
      trips
        .filter((trip) => getTripStatus(trip.startDate, trip.endDate) !== 'past')
        .toSorted((curr, next) => curr.startDate.localeCompare(next.startDate)),
  })
}
