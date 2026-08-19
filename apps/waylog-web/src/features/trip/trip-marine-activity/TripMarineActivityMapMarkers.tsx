import { Fragment, useMemo } from "react";
import { getMarineActivityMarkerItems } from "~features/marine-activity/marineActivity.api";
import { useDailyMarineActivityIndices } from "~features/marine-activity/useDailyMarineActivityIndices";
import { Map } from "~shared/components/Map";
import type { Trip } from "../trip.types";
import { createMarineActivityMarkerIcon } from "./MarineActivityMarkerIcon";
import { useTripMarineActivityDetailOverlay } from "./TripMarineActivityDetailOverlay";
import { useActiveTripDay } from "../trip-route/useActiveTripDay";
import { useTrip } from "../useTrip";

interface TripMarineActivityMapMarkersProps {
  tripId: string;
}

export function TripMarineActivityMapMarkers({ tripId }: TripMarineActivityMapMarkersProps) {
  const detailOverlay = useTripMarineActivityDetailOverlay(tripId);
  const { data: { lat, lng } } = useTrip(tripId);
  const { value: activedTripDate } = useActiveTripDay(tripId);
  const { data } = useDailyMarineActivityIndices({ coordinate: { lat, lng }, date: activedTripDate });

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
            if (!activedTripDate) return;
            detailOverlay.open({
              placeCode: markerItem.placeCode,
              placeName: markerItem.placeName,
              initialDate: activedTripDate,
            });
          }}
        />
      ))}
    </Fragment>
  );
}
