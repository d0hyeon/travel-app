import { useQuery } from "@tanstack/react-query";
import type { Trip } from "~features/trip/trip.types";
import { getTripMarineActivityEligibility } from "./marineActivityEligibility";
import { getDailyMarineActivityIndices, getIsMarineActivityForecastAvailability } from "./marineActivity.api";

interface UseDailyMarineActivityIndicesParams {
  trip: Trip | undefined;
  date: string | null;
}

export function useDailyMarineActivityIndices({
  trip,
  date,
}: UseDailyMarineActivityIndicesParams) {
  const tripCoordinate = trip ? { lat: trip.lat, lng: trip.lng } : null;
  const eligibility = getTripMarineActivityEligibility({
    destinations: trip?.destinations ?? [],
    coordinate: tripCoordinate,
  });
  const isForecastDateAvailable = date
    ? getIsMarineActivityForecastAvailability(date)
    : false;

  return useQuery({
    queryKey: ["daily-marine-activity-indices", trip?.id, date],
    queryFn: () =>
      getDailyMarineActivityIndices({
        coordinate: { lat: trip!.lat, lng: trip!.lng },
        date: date!,
      }),
    enabled: Boolean(trip && date && eligibility.isEligible && isForecastDateAvailable),
    meta: {
      disabledReason: eligibility.isEligible
        ? isForecastDateAvailable
          ? null
          : "OUT_OF_FORECAST_RANGE"
        : eligibility.reason,
    },
  });
}
