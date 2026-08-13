import { Skeleton, Stack, Typography } from "@mui/material";
import { useState } from "react";
import { getIsMarineActivityForecastAvailability } from "~features/marine-activity/marineActivity.api";
import { getTripMarineActivityEligibility } from "~features/marine-activity/marineActivityEligibility";
import { MarineActivityDisableReason, MarineActivityType, type MarineActivityIndex } from "~features/marine-activity/marineActivity.types";
import { useDailyMarineActivityIndices } from "~features/marine-activity/useDailyMarineActivityIndices";
import type { Trip } from "../trip.types";
import { TripMarineActivityIndexCard } from "./TripMarineActivityIndexCard";
import { TripMarineActivityIndexDetails } from "./TripMarineActivityIndexDetails";

interface TripMarineActivityIndexBarProps {
  trip: Trip;
  selectedDate: string | null;
}

export function TripMarineActivityIndexBar({
  trip,
  selectedDate,
}: TripMarineActivityIndexBarProps) {
  const query = useDailyMarineActivityIndices({ trip, date: selectedDate });
  const [selectedIndex, setSelectedIndex] = useState<MarineActivityIndex | null>(null);
  const eligibility = getTripMarineActivityEligibility({
    destinations: trip.destinations,
    coordinate: { lat: trip.lat, lng: trip.lng },
  });
  const isForecastDateAvailable = selectedDate
    ? getIsMarineActivityForecastAvailability(selectedDate)
    : false;
  const isDisabledByDestination = eligibility.isEligible === false;

  if (isDisabledByDestination) {
    return null;
  }

  if (!isForecastDateAvailable) {
    return null;
  }

  if (query.isLoading) {
    return (
      <Stack direction="row" gap={1}>
        <Skeleton variant="rounded" width="100%" height={72} />
        <Skeleton variant="rounded" width="100%" height={72} />
      </Stack>
    );
  }

  if (query.isError) {
    return (
      <Typography variant="body2" color="text.secondary">
        해양 지수를 불러오지 못했어요
      </Typography>
    );
  }

  if (!query.data || query.data.indices.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        이 지역은 제공되는 해양 지수가 없어요
      </Typography>
    );
  }

  const indicesByType = new Map(query.data.indices.map((index) => [index.type, index]));

  return (
    <>
      <Stack direction="row" gap={1}>
        {[
          { type: MarineActivityType.Beach, label: "해수욕" },
          { type: MarineActivityType.SkinScuba, label: "스킨스쿠버" },
        ].flatMap(({ type, label }) => {
          const index = indicesByType.get(type);
          if (!index) return [];
          return [
            <TripMarineActivityIndexCard
              key={type}
              label={label}
              index={index}
              onOpenDetails={() => setSelectedIndex(index)}
            />,
          ];
        })}
      </Stack>
      {selectedIndex && (
        <TripMarineActivityIndexDetails
          index={selectedIndex}
          isOpen={selectedIndex != null}
          onClose={() => setSelectedIndex(null)}
        />
      )}
    </>
  );
}
