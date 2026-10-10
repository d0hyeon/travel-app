import { useSuspenseQuery } from "@waylog/react";
import { getAllTrips, tripKey, type Trip } from "@waylog/domains/modules/trip";
import { getTripStatus } from "@waylog/domains/modules/trip";
import { SortCommand } from "~shared/utils/sorts";
import { getDate } from "date-fns";
import type { UseSuspenseQueryResult } from "@tanstack/react-query";

interface Options {
  enabled?: boolean;
}

export function useScheduledTrips(options: { enabled?: boolean }): UseSuspenseQueryResult<Trip[] | undefined>;
export function useScheduledTrips(options?: Options): UseSuspenseQueryResult<Trip[]>

export function useScheduledTrips(options?: Options) {
  return useSuspenseQuery({
    queryKey: [tripKey],
    queryFn: getAllTrips,
    select: (trips) => trips
      .filter(trip => {
        const status = getTripStatus(trip.startDate, trip.endDate);
        return status !== 'past'
      })
      .sort((curr, next) => getDate(curr.startDate) < getDate(next.startDate)
        ? SortCommand.Shift
        : SortCommand.Maintain
      ),
    ...options
  })
} 

