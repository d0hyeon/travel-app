import { useQueryParamState } from "~shared/hooks/urls/useQueryParamState";
import { useTrip } from "@waylog/domains/trip";
import { formatDisplayDate } from "@waylog/domains/utils";

export function useActiveTripDay(tripId: string) {
  const { data: trip } = useTrip(tripId);
  const [value, update] = useQueryParamState<string>("days", {
    defaultValue: () => {
      const today = new Date().toISOString().split("T")[0];
      if (today >= trip.startDate && today <= trip.endDate) {
        return formatDisplayDate(today);
      }
      return formatDisplayDate(trip.startDate);
    },
  });

  return { value, update };
}
