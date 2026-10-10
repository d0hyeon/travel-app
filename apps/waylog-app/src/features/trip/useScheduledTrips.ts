import { useSuspenseQuery } from '@waylog/react'
import { getAllTrips, getTripStatus, Trip, tripKey } from '@waylog/domains/modules/trip'
import { UseSuspenseQueryResult } from '@tanstack/react-query';

interface Options {
  enabled?: boolean;
}

export function useScheduledTrips(options: { enabled?: boolean }): UseSuspenseQueryResult<Trip[] | undefined>;
export function useScheduledTrips(options?: Options): UseSuspenseQueryResult<Trip[]>
export function useScheduledTrips(options?: Options) {
  return useSuspenseQuery({
    queryKey: [tripKey],
    queryFn: getAllTrips,
    select: (trips) =>
      trips
        .filter((trip) => getTripStatus(trip.startDate, trip.endDate) !== 'past')
        .toSorted((curr, next) => curr.startDate.localeCompare(next.startDate)),
    ...options,
  })
}
