import type { Trip } from "~features/trip/trip.types";
import { getTripMarineActivityEligibility } from "./marineActivityEligibility";
import {
  getDailyMarineActivityIndices,
  getIsMarineActivityForecastAvailability,
} from "./marineActivity.api";
import { useSuspenseQuery } from "@waylog/react";
import type { Coordinate } from "@waylog/domains/utils";

interface UseDailyMarineActivityIndicesParams {
  coordinate: Coordinate;
  date: string;
}

export function useDailyMarineActivityIndices({
  coordinate,
  date,
}: UseDailyMarineActivityIndicesParams) {
  const eligibility = getTripMarineActivityEligibility({ coordinate });
  const isForecastDateAvailable = getIsMarineActivityForecastAvailability(date);
  const isQueryEnabled = eligibility.isEligible && isForecastDateAvailable;

  return useSuspenseQuery({
    queryKey: ["daily-marine-activity-indices", coordinate, date],
    queryFn: () => getDailyMarineActivityIndices({ coordinate, date }),
    enabled: isQueryEnabled,
    meta: {
      disabledReason: eligibility.isEligible
        ? isForecastDateAvailable
          ? null
          : "OUT_OF_FORECAST_RANGE"
        : eligibility.reason,
    },
  });
}
