import { useSuspenseQuery } from "@waylog/react";
import { getAllTrips, tripKey } from "@waylog/domains/trip";
import { getTripStatus } from "./trip-list/trip-list.utils";
import { SortCommand } from "~shared/utils/sorts";
import { getDate } from "date-fns";

export function useScheduledTrips() {
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
      )
  })
} 

