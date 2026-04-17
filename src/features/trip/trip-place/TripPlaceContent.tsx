import { useMemo, useRef } from "react";
import { Box, Button, ButtonBase, Chip, Stack, Typography, type BoxProps } from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import { useTripPlaces } from "./useTripPlaces";
import { useTripRoutes } from "../trip-route/useTripRoutes";
import { useTrip } from "../useTrip";
import type { Place } from "../../place/place.types";
import { Map, type MapRef } from "../../../shared/components/Map";
import { useOverlay } from "../../../shared/hooks/useOverlay";
import { PlaceSearchDialog, type PlaceSearchResult } from "../../place/place-search/PlaceSearchDialog";

interface Props extends BoxProps {
  tripId: string;
  defaultCenter: { lat: number; lng: number };
}

export function TripPlaceContent({ tripId, defaultCenter, ...props }: Props) {
  const { data: trip } = useTrip(tripId)
  const { data: places, create } = useTripPlaces(tripId)
  const { data: { routes } } = useTripRoutes(tripId)
  const overlay = useOverlay()
  const mapRef = useRef<MapRef>(null)
  const mapType = trip.isOverseas ? 'google' : 'kakao'

  const handleAddPlace = () => {
    overlay.open(({ isOpen, close }) => (
      <PlaceSearchDialog
        isOpen={isOpen}
        onClose={close}
        onSelect={(place: PlaceSearchResult) => {
          create({
            name: place.name,
            address: place.address,
            lat: place.lat,
            lng: place.lng,
            status: 'wished',
            tags: [],
            memo: '',
          })
        }}
      />
    ))
  }

  const handlePlaceClick = (place: Place) => {
    mapRef.current?.panTo(place.lat, place.lng)
  }

  // 경로에 포함된 장소 ID 집합
  const confirmedPlaceIds = useMemo(() => {
    const ids = new Set<string>()
    routes.forEach((route) => {
      route.placeIds.forEach((id) => ids.add(id))
    })
    return ids
  }, [routes])

  const confirmedPlaces = places.filter((p) => confirmedPlaceIds.has(p.id))
  const wishedPlaces = places.filter((p) => !confirmedPlaceIds.has(p.id))

  return (
    <Box {...props}>
      <Map
        type={mapType}
        ref={mapRef}
        defaultCenter={defaultCenter}
        height={300}
        borderRadius={2}
        mb={2}
        bgcolor="grey.100"
      >
        <>
          {places.map(place => (
            <Map.Marker
              key={place.id}
              color={confirmedPlaceIds.has(place.id) ? 'selected' : 'default'}
              label={place.name}
              {...place}
            />
          ))}
        </>
      </Map>
      <Button
        variant="outlined"
        startIcon={<AddIcon />}
        onClick={handleAddPlace}
        fullWidth
        sx={{ mb: 3 }}
      >
        장소 추가
      </Button>
      <Typography variant="subtitle2" color="text.secondary" mb={1}>
        확정된 장소 ({confirmedPlaces.length})
      </Typography>
      {confirmedPlaces.length === 0 ? (
        <Typography variant="body2" color="text.secondary" mb={3}>
          아직 확정된 장소가 없어요
        </Typography>
      ) : (
        <Stack spacing={1} mb={3}>
          {confirmedPlaces.map((place) => (
            <PlaceItem key={place.id} place={place} onClick={() => handlePlaceClick(place)} />
          ))}
        </Stack>
      )}

      <Typography variant="subtitle2" color="text.secondary" mb={1}>
        희망 장소 ({wishedPlaces.length})
      </Typography>
      {wishedPlaces.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          희망 장소를 추가해보세요
        </Typography>
      ) : (
        <Stack spacing={1}>
          {wishedPlaces.map((place) => (
            <PlaceItem key={place.id} place={place} onClick={() => handlePlaceClick(place)} />
          ))}
        </Stack>
      )}
    </Box>
  )
}

function PlaceItem({ place, onClick }: { place: Place; onClick: () => void }) {
  return (
    <ButtonBase
      onClick={onClick}
      sx={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        p: 2,
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        '&:hover': { bgcolor: 'action.hover' },
      }}
    >
      <Typography fontWeight="medium">{place.name}</Typography>
      {place.address && (
        <Typography variant="body2" color="text.secondary">
          {place.address}
        </Typography>
      )}
      {place.tags.length > 0 && (
        <Stack direction="row" spacing={0.5} mt={1}>
          {place.tags.map((tag) => (
            <Chip key={tag} label={tag} size="small" />
          ))}
        </Stack>
      )}
      {place.memo && (
        <Typography variant="body2" color="text.secondary" mt={1}>
          {place.memo}
        </Typography>
      )}
    </ButtonBase>
  )
}
