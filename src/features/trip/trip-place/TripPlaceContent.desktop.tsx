import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import {
  Box,
  Button,
  Chip,
  IconButton,
  Stack,
  Typography
} from '@mui/material'
import { useMemo, useRef } from 'react'
import { useTripPlaces } from './useTripPlaces'
import { useTripRoutes } from '../trip-route/useTripRoutes'
import { KakaoMap, type KakaoMapRef } from '../../../shared/components/KakaoMap'
import { PlaceCategoryColorCode, type Place } from '../../place/place.types'
import { ListItem } from '../../../shared/components/ListItem'
import { useTripPlaceDetailOverlay } from './useTripPlaceDetailOverlay'
import { usePlaceSearchDialog } from '../../place/place-search/usePlaceSearchDialog'

interface TripPlaceContentProps {
  tripId: string
  defaultCenter: { lat: number; lng: number }
  clusterable?: boolean
}

export function TripPlaceContent({ tripId, defaultCenter, clusterable }: TripPlaceContentProps) {
  const { data: places, create, remove } = useTripPlaces(tripId)
  const { data: { routes } } = useTripRoutes(tripId)
  const mapRef = useRef<KakaoMapRef>(null)

  const { openDialog: openPlaceDetailDialog } = useTripPlaceDetailOverlay();

  const handleDeletePlace = (placeId: string) => {
    if (confirm('이 장소를 삭제하시겠습니까?')) {
      remove(placeId)
    }
  }

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
                  <ListItem
                    key={place.id}
                    sx={{ cursor: 'pointer' }}
                    onClick={() => handlePlaceClick(place)}
                    rightAddon={(
                      <Box flexShrink={0}>
                        <IconButton size="small" onClick={() => {
                          openPlaceDetailDialog({ placeId: place.id, tripId });
                        }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDeletePlace(place.id) }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    )}
                  >
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                      <ListItem.Title>{place.name}</ListItem.Title>

                    </Box>
                    {place.address && (
                      <ListItem.Text variant="body2" color="text.secondary" fontSize={12}>
                        {place.address}
                      </ListItem.Text>
                    )}
                    {!!place.memo && (
                      <ListItem.Text variant="body2" color="text.secondary" fontSize={12}>
                        {place.memo}
                      </ListItem.Text>
                    )}
                    {place.tags.length > 0 && (
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mt: 0.5 }}>
                        {place.tags.map(x => (
                          <Chip key={x} label={x} size="small" />
                        ))}
                      </Stack>
                    )}
                  </ListItem>
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
                  <ListItem
                    key={place.id}
                    sx={{ cursor: 'pointer' }}
                    onClick={() => handlePlaceClick(place)}
                    rightAddon={(
                      <Box flexShrink={0}>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            openPlaceDetailDialog({ placeId: place.id, tripId });
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePlace(place.id)
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    )}
                  >
                    <Stack direction="row" gap={0.5} alignItems="center">
                      {!!place.category && (
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            bgcolor: PlaceCategoryColorCode[place.category],
                          }}
                        />
                      )}
                      <ListItem.Title>{place.name}</ListItem.Title>
                    </Stack>
                    {place.address && (
                      <ListItem.Text variant="body2" color="text.secondary" fontSize={12}>
                        {place.address}
                      </ListItem.Text>
                    )}
                    {!!place.memo && (
                      <ListItem.Text variant="body2" color="text.secondary" fontSize={12}>
                        {place.memo}
                      </ListItem.Text>
                    )}
                    {place.tags.length > 0 && (
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mt: 0.5 }}>
                        {place.tags.map(x => (
                          <Chip key={x} label={x} size="small" />
                        ))}
                      </Stack>
                    )}
                  </ListItem>
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
      <Box sx={{ flex: 1 }}>
        <KakaoMap
          ref={mapRef}
          defaultCenter={defaultCenter}
          height="100%"
          clustering={clusterable}
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
