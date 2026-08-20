import { useQueryParamState } from "~shared/hooks/urls/useQueryParamState";
import { getDefaultTripDay, useTrip } from "@waylog/domains/trip";

export function useActiveTripDay(tripId: string) {
  const { data: trip } = useTrip(tripId);
  const [value, update] = useQueryParamState<string>("days", {
    defaultValue: () => getDefaultTripDay(trip, new Date().toISOString().split("T")[0]!),
  });

  return { value, update };
}
