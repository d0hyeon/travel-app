import { Button, type ButtonProps } from "@mui/material";
import { usePlaceSearchBottomSheet } from "~features/place/place-search/usePlaceSearchBottomSheet";
import { useTrip } from "../useTrip";
import { useTripPlaces } from "./useTripPlaces";
import type { Place } from "~features/place/place.types";
import { Suspense } from "react";

interface Props extends ButtonProps {
  tripId: string;
  onAddedPlace?: (place: Place) => void;
}

export function TripPlaceAdditionButton(props: Props) {
  return (
    <Suspense>
      <Resolved {...props} />
    </Suspense>
  )
}
function Resolved({ tripId, onAddedPlace, ...props }: Props) {
  const { data: trip } = useTrip(tripId);
  const { create } = useTripPlaces(tripId)

  const { searchPlace } = usePlaceSearchBottomSheet({
    service: trip.isOverseas ? 'google' : 'kakao',
    center: { lat: trip.lat, lng: trip.lng }
  });

  return (
    <Button
      onClick={async () => {
        const place = await searchPlace();
        if (place == null) return;
        const added = await create(place);
        onAddedPlace?.(added);
      }}
      {...props}
    >
      장소 추가
    </Button>
  )
}