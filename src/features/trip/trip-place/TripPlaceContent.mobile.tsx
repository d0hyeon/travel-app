import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import WorkspacesIcon from '@mui/icons-material/Workspaces';
import { Box, Button, Chip, IconButton, Stack, ToggleButton, Typography } from "@mui/material";
import { useMemo, useRef, useState } from "react";
import { useQueryParamState } from '~shared/hooks/useQueryParamState';
import { useConfirmDialog } from '~shared/modules/confirm-dialog/useConfirmDialog';
import { DraggableBottomSheet } from "../../../shared/components/DraggableBottomSheet";
import { KakaoMap, type KakaoMapRef } from "../../../shared/components/KakaoMap";
import { ListItem } from '../../../shared/components/ListItem';
import { usePlaceSearchBottomSheet } from '../../place/place-search/usePlaceSearchBottomSheet';
import { PlaceCategoryColorCode, type Place } from "../../place/place.types";
import { useTripRoutes } from "../trip-route/useTripRoutes";
import { useTripPlaceDetailOverlay } from "./useTripPlaceDetailOverlay";
import { useTripPlaces } from "./useTripPlaces";

interface PlaceContentProps {
  tripId: string
  defaultCenter: { lat: number; lng: number }
}

const BOTTOM_SHEET_RATIOS = [0.25, 0.5, 0.8, 1] as const;
const DEFAULT_BOTTOM_SHEET_RATIO = 0.5 satisfies typeof BOTTOM_SHEET_RATIOS[number];

export function TripPlaceContent({ tripId, defaultCenter }: PlaceContentProps) {
  const { data: places, create, remove } = useTripPlaces(tripId)
  const { data: { routes } } = useTripRoutes(tripId)
  const mapRef = useRef<KakaoMapRef>(null)

  const { openBottomSheet: openPlaceDetailBottomSheet } = useTripPlaceDetailOverlay();


  const confirm = useConfirmDialog();
  const handleDeletePlace = async (placeId: string) => {
    if (await confirm('이 장소를 삭제하시겠습니까?')) {
      remove(placeId)
    }
  }

  const { searchPlace } = usePlaceSearchBottomSheet();
  const handleAddPlace = async () => {
    const place = await searchPlace();
    if (place == null) return;
    create(place)
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
  const [sheetRatio, setSheetRatio] = useState(DEFAULT_BOTTOM_SHEET_RATIO)

  return (
    <>
      <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <Stack gap={1} padding={1} position="absolute" top={0} right={0} zIndex={8}>
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
        {/* Map (전체) */}
        <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: `${sheetRatio * 100}%` }}>
          <KakaoMap
            ref={mapRef}
            defaultCenter={defaultCenter}
            height="100%"
            clustering={cluastering}
            clusterGridSize={50}
          >
            {places.map(place => (
              <KakaoMap.Marker
                key={place.id}
                variant={confirmedPlaceIds.has(place.id) ? 'selected' : 'default'}
                label={place.name}
                lat={place.lat}
                lng={place.lng}
                color={place.category ? PlaceCategoryColorCode[place.category] : undefined}
                onClick={() => openPlaceDetailBottomSheet({ placeId: place.id, tripId })}
              />
            ))}
          </KakaoMap>
        </Box>

        {/* Bottom Sheet */}
        <DraggableBottomSheet
          snapPoints={BOTTOM_SHEET_RATIOS}
          defaultSnapIndex={BOTTOM_SHEET_RATIOS.indexOf(DEFAULT_BOTTOM_SHEET_RATIO)}
          onSnapChange={(ratio) => {
            if (ratio < 1 && ratio !== sheetRatio) {
              setSheetRatio(ratio)
              setTimeout(() => mapRef.current?.relayout(), 350)
            }
          }}
        >
          <Box sx={{ p: 1.5 }}>
            <Typography variant="caption" color="text.secondary" fontWeight="medium" mb={0.5} display="block">
              확정 ({confirmedPlaces.length}) / 후보 ({wishedPlaces.length})
            </Typography>

            <Stack spacing={0.75}>
              {confirmedPlaces.map((place) => (
                <ListItem
                  key={place.id}
                  sx={{ borderColor: 'primary.main' }}
                  onClick={() => handlePlaceClick(place)}
                  rightAddon={(
                    <Box flexShrink={0}>
                      <IconButton size="small" onClick={() => {
                        openPlaceDetailBottomSheet({ placeId: place.id, tripId });
                      }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDeletePlace(place.id) }}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  )}
                >
                  <Stack direction="row" gap={0.5} alignItems="center">
                    {!!place.category && (
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
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
              {wishedPlaces.map((place) => (
                <ListItem
                  key={place.id}
                  sx={{ cursor: 'pointer' }}
                  onClick={() => handlePlaceClick(place)}
                  rightAddon={(
                    <Box flexShrink={0}>
                      <IconButton size="small" onClick={() => {
                        openPlaceDetailBottomSheet({ placeId: place.id, tripId });
                      }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDeletePlace(place.id) }}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  )}
                >
                  <Stack direction="row" gap={0.5} alignItems="center">
                    {!!place.category && (
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
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
          </Box>
        </DraggableBottomSheet>
      </Box>
      <Box padding={1}>
        <Button
          size="large"
          variant="contained"
          onClick={handleAddPlace}
          sx={{ fontSize: 12 }}
          fullWidth
        >
          장소 추가
        </Button>
      </Box>
    </>
  )
}

