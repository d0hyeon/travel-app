import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import {
  Box,
  Button,
  Chip,
  IconButton,
  Stack,
  ToggleButton,
  Typography
} from '@mui/material'
import { useMemo, useRef, type ComponentProps } from 'react'
import { useTripPlaces } from './useTripPlaces'
import { useTripRoutes } from '../trip-route/useTripRoutes'
import { KakaoMap, type KakaoMapRef } from '../../../shared/components/KakaoMap'
import { PlaceCategoryColorCode, type Place } from '../../place/place.types'
import { ListItem } from '../../../shared/components/ListItem'
import { useTripPlaceDetailOverlay } from './useTripPlaceDetailOverlay'
import { usePlaceSearchDialog } from '../../place/place-search/usePlaceSearchDialog'
import WorkspacesIcon from '@mui/icons-material/Workspaces';
import { useQueryParamState } from '~shared/hooks/useQueryParamState'
import { useConfirmDialog } from '~shared/modules/confirm-dialog/useConfirmDialog'
import { TripPlaceItem } from './TripPlaceItem'

interface TripPlaceContentProps {
  tripId: string
  defaultCenter: { lat: number; lng: number }
}

export function TripPlaceContent({ tripId, defaultCenter }: TripPlaceContentProps) {
  const { data: places, create } = useTripPlaces(tripId)
  const { data: { routes } } = useTripRoutes(tripId)
  const mapRef = useRef<KakaoMapRef>(null)

  const { openDialog: openPlaceDetailDialog } = useTripPlaceDetailOverlay();

  const { searchPlace } = usePlaceSearchDialog();

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

  const [cluastering, setCluastering] = useQueryParamState('cluaster', {
    defaultValue: false,
    parse: value => value === 'true'
  })

  return (
    <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      {/* Left: List (30%) */}
      <Box sx={{ width: '30%', borderRight: 1, borderColor: 'divider', overflow: 'auto', p: 2 }}>
        <Stack height="100%">
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
                  <TripPlaceItem key={place.id} place={place} onClick={() => handlePlaceClick(place)} />
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
                  <TripPlaceItem key={place.id} place={place} onClick={() => handlePlaceClick(place)} />
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
        <KakaoMap
          ref={mapRef}
          defaultCenter={defaultCenter}
          height="100%"
          clustering={cluastering}
          clusterGridSize={60}
        >
          {places.map(place => (
            <KakaoMap.Marker
              key={place.id}
              variant={confirmedPlaceIds.has(place.id) ? 'selected' : 'default'}
              label={place.name}
              lat={place.lat}
              lng={place.lng}
              color={place.category ? PlaceCategoryColorCode[place.category] : undefined}
              onClick={() => openPlaceDetailDialog({ placeId: place.id, tripId })}
            />
          ))}
        </KakaoMap>
      </Box>
    </Box>
  )
}