import { Fragment, useMemo } from "react";
import { getMarineActivityMarkerItems } from "~features/marine-activity/marineActivity.api";
import { useDailyMarineActivityIndices } from "~features/marine-activity/useDailyMarineActivityIndices";
import { Map } from "~shared/components/Map";
import type { Trip } from "../trip.types";
import { createMarineActivityMarkerIcon } from "./MarineActivityMarkerIcon";
import { useTripMarineActivityDetailOverlay } from "./TripMarineActivityDetailOverlay";

interface TripMarineActivityMapMarkersProps {
  trip: Trip;
  selectedDate: string | null;
}

export function TripMarineActivityMapMarkers({
  trip,
  selectedDate,
}: TripMarineActivityMapMarkersProps) {
  const detailOverlay = useTripMarineActivityDetailOverlay();
  const { data } = useDailyMarineActivityIndices({ trip, date: selectedDate });

  const markerItems = useMemo(() => {
    if (!data) return [];
    return getMarineActivityMarkerItems(data);
  }, [data]);
  return (
    <Fragment>
      {markerItems.map((markerItem) => (
        <Map.Marker
          key={markerItem.placeCode}
          lat={markerItem.coordinate.lat}
          lng={markerItem.coordinate.lng}
          label={markerItem.placeName}
          tooltip={markerItem.indices.map((index) => {
            const activityLabel = index.type === "beach" ? "해수욕" : "스킨스쿠버";
            return `${activityLabel}: ${index.gradeLabel}`;
          })}
          thumbnailUrl={createMarineActivityMarkerIcon(markerItem)}
          onClick={() => {
            if (!selectedDate) return;
            detailOverlay.open({
              trip,
              placeCode: markerItem.placeCode,
              placeName: markerItem.placeName,
              initialDate: selectedDate,
            });
          }}
        />
      ))}
    </Fragment>
  );
}
