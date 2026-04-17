import AddIcon from '@mui/icons-material/Add'
import WorkspacesIcon from '@mui/icons-material/Workspaces'
import {
  Box,
  Button,
  Stack,
  ToggleButton,
  Typography
} from '@mui/material'
import { useMemo, useRef, useState } from 'react'
import { Map, type MapRef } from '../../../shared/components/Map'
import { usePlaceSearchDialog } from '../../place/place-search/usePlaceSearchDialog'
import { PlaceCategoryColorCode, type Place } from '../../place/place.types'
import { useTripCluastering } from '../hooks/useTripCluastering'
import { useTripRoutes } from '../trip-route/useTripRoutes'
import { useTrip } from '../useTrip'
import { TripPlaceItemButton } from './TripPlaceItemButton'
import { useTripPlaceDetailOverlay } from './useTripPlaceDetailOverlay'
import { useTripPlaces } from './useTripPlaces'

interface TripPlaceContentProps {
  tripId: string
}

export function TripPlaceContent({ tripId }: TripPlaceContentProps) {
  const { data: trip } = useTrip(tripId)
  const { data: places, create } = useTripPlaces(tripId)
  const { data: { routes } } = useTripRoutes(tripId)
  const mapRef = useRef<MapRef>(null)
  const mapType = trip.isOverseas ? 'google' : 'kakao'

  const { searchPlace } = usePlaceSearchDialog({ mapType });

  const handleAddPlace = async () => {
    const place = await searchPlace();
    if (place == null) return;
    create(place);
  }

  const handlePlaceClick = (place: Place) => {
    mapRef.current?.panTo(place.lat, place.lng)
  }

  const confirmedPlaceIds = useMemo(() => {
    const ids = new Set<string>()
    routes.forEach((route) => {
      route.placeIds.forEach((id) => ids.add(id))
    })
    return ids
  }, [routes])

  const confirmedPlaces = places.filter((p) => confirmedPlaceIds.has(p.id))
  const wishedPlaces = places.filter((p) => !confirmedPlaceIds.has(p.id))

  const [cluastering, setCluastering] = useTripCluastering();
  const [focusedId, setFocusedId] = useState<string | null>(null)
  const { openDialog: openDetailDialog } = useTripPlaceDetailOverlay()

  return (
    <Box height="100%" sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      {/* Left: List (30%) */}
      <Box sx={{ width: '30%', borderRight: 1, borderColor: 'divider', overflow: 'auto', p: 2, scrollBehavior: 'smooth', scrollMarginBottom: 40 }}>
        <Stack height="100%" sx={{ scrollBehavior: 'smooth' }}>
          <Box flex="1 1 100%" paddingBottom={3}>
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
                  <TripPlaceItemButton
                    key={place.id}
                    place={place}
                    onClick={() => handlePlaceClick(place)}
                    component="button"
                    focused={place.id === focusedId}
                  />
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
                  <TripPlaceItemButton
                    key={place.id}
                    place={place}
                    onClick={() => handlePlaceClick(place)}
                    focused={place.id === focusedId}
                  />
                ))}
              </Stack>
            )}
          </Box>
          <Box padding={1} position="sticky" bottom={0} flex="0 0 auto" sx={{ backgroundColor: '#fff' }}>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleAddPlace}
              fullWidth

            >
              장소 추가
            </Button>
          </Box>
        </Stack>
      </Box>

      {/* Right: Map (70%) */}
      <Box sx={{ flex: 1, position: 'relative' }}>
        <Stack gap={1} padding={1} position="absolute" top={0} right={0} zIndex={1000}>
          <ToggleButton
            value="check"
            selected={cluastering}
            onChange={() => setCluastering(!cluastering)}
            size="small"
            sx={{ backgroundColor: 'rgba(255, 255, 255, 0.7)' }}
          >
            <WorkspacesIcon />
          </ToggleButton>
        </Stack>
        <Map
          type={mapType}
          ref={mapRef}
          defaultCenter={{ lat: trip.lat, lng: trip.lng }}
          height="100%"
          clustering={cluastering}
          clusterGridSize={60}
        >
          {places.map(place => (
            <Map.Marker
              key={place.id}
              label={place.name}
              lat={place.lat}
              lng={place.lng}
              color={place.category ? PlaceCategoryColorCode[place.category] : undefined}
              onClick={() => {
                setFocusedId(place.id);
                openDetailDialog({ tripId, placeId: place.id, })
              }}
            />
          ))}
        </Map>
      </Box>
    </Box>
  )
}