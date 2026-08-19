import { Button } from "@mui/material";
import { PlaceSearchDialog, type PlaceSearchResult } from "~features/place/place-search/PlaceSearchDialog";
import { useTripPlaces } from "~features/trip/trip-place/useTripPlaces";
import { useTrip } from "@waylog/domains/trip";
import { useOverlay } from "~shared/hooks/useOverlay";
import AddIcon from '@mui/icons-material/Add';

interface Props {
  tripId: string;
}

export function TripRutePlaceAddButton({ tripId, }: Props) {
  const { data: { isOverseas } } = useTrip(tripId);
  const { create: createPlace } = useTripPlaces(tripId)
  const overlay = useOverlay();

  return (
    <Button
      variant="outlined"
      startIcon={<AddIcon />}
      onClick={() => {
        overlay.open(({ isOpen, close }) => (
          <PlaceSearchDialog
            isOpen={isOpen}
            onClose={close}
            service={isOverseas ? 'google' : 'kakao'}
            onSelect={(place: PlaceSearchResult) => createPlace(place)}
          />
        ))
      }}
      fullWidth
    >
      장소 추가
    </Button>
  )
}