import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityOnIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import WorkspacesIcon from '@mui/icons-material/Workspaces';
import { Box, Button, Chip, IconButton, Stack, styled, Tab, Tabs, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import { useMemo, useRef, useState } from "react";
import { BottomArea } from '~shared/components/BottomArea';
import { useQueryParamState } from '~shared/hooks/useQueryParamState';
import { useConfirmDialog } from '~shared/modules/confirm-dialog/useConfirmDialog';
import { DraggableBottomSheet } from "../../../shared/components/DraggableBottomSheet";
import { KakaoMap, type KakaoMapRef } from "../../../shared/components/KakaoMap";
import { ListItem } from "../../../shared/components/ListItem";
import { SortableItem } from "../../../shared/components/dnd/SortableItem";
import { SortableList } from "../../../shared/components/dnd/SortableList";
import { useOverlay } from "../../../shared/hooks/useOverlay";
import { useRoadPath } from "../../../shared/hooks/useRoadPath";
import { formatDate, formatDateISO } from "../../../shared/utils/formats";
import { PlaceCategoryColorCode } from "../../place/place.types";
import { useTripPlaces } from "../trip-place/useTripPlaces";
import { useTrip } from '../useTrip';
import { PlaceSelectSheet } from "./PlaceSelectSheet";
import { NoteEditor } from './RouteNoteList';
import { useDayTripRoutes } from './useDayTripRoutes';
import { usePlaceFormOverlay } from './usePlaceFormOverlay';

// 경로별 색상 팔레트
const ROUTE_COLORS = [
  '#1976d2', // blue
  '#e53935', // red
  '#43a047', // green
  '#fb8c00', // orange
  '#8e24aa', // purple
  '#00acc1', // cyan
]

function getRouteColor(index: number): string {
  return ROUTE_COLORS[index % ROUTE_COLORS.length]
}

interface RouteContentProps {
  tripId: string;
  defaultCenter: { lat: number; lng: number }
}

const BOTTOM_SHEET_RATIOS = [0.25, 0.5, 0.8, 1] as const;
const DEFAULT_BOTTOM_SHEET_RATIO = 0.5 satisfies typeof BOTTOM_SHEET_RATIOS[number];

export function TripRoutesContent({ tripId, defaultCenter }: RouteContentProps) {

  const { data: trip } = useTrip(tripId);
  const { data: places, update: updatePlace } = useTripPlaces(tripId)

  const [selectedDate, setSelectedDate] = useQueryParamState<string>('days', {
    defaultValue: () => {
      const today = new Date().toISOString().split('T')[0]
      if (today >= trip.startDate && today <= trip.endDate) {
        return formatDateISO(today)
      }
      return formatDateISO(trip.startDate)
    }
  })
  const {
    data: { routes, tripDates },
    create: createRoute,
    update,
    remove: removeRoute,
    updateNotes
  } = useDayTripRoutes({ tripId, date: selectedDate })
  const [selectedRouteId, setSelectedRouteId] = useQueryParamState<string | null>('route-id', {
    defaultValue: routes?.[0]?.id ?? null
  })

  const currentRoute = useMemo(() => {
    if (selectedRouteId) return routes.find((r) => r.id === selectedRouteId) ?? routes[0];
    return routes[0];
  }, [routes, selectedRouteId])

  const { openBottomsheet: getUpdatedPlace } = usePlaceFormOverlay();

  const [isVisibleOtherMarkers, setIsVisibleOtherMarkers] = useQueryParamState('marker', {
    defaultValue: true,
    parse: x => x === 'true'
  })
  const [cluastering, setCluastering] = useQueryParamState('cluaster', {
    defaultValue: false,
    parse: value => value === 'true'
  })
  const [sheetRatio, setSheetRatio] = useState(DEFAULT_BOTTOM_SHEET_RATIO);
  const [focusedId, setFocusedId] = useState<string | null>(null)

  const mapRef = useRef<KakaoMapRef>(null)
  const overlay = useOverlay()
  const confirm = useConfirmDialog();


  return (
    <>
      <Box sx={{ flex: 1, position: 'relative' }}>
        {/* Map (전체) */}
        <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: `calc(${sheetRatio * 100}% - 10px)` }}>
          <Stack gap={1} padding={1} position="absolute" top={0} left={0} zIndex={8}>
            <ToggleButtonGroup
              orientation="vertical"
              value={isVisibleOtherMarkers}
              exclusive
              size="small"
              sx={{ backgroundColor: 'rgba(255, 255, 255, 0.8)' }}
            >
              <ToggleButton value={true} aria-label="list" onClick={() => setIsVisibleOtherMarkers(true)}>
                <VisibilityOnIcon fontSize="small" />
              </ToggleButton>
              <ToggleButton value={false} aria-label="module" onClick={() => setIsVisibleOtherMarkers(false)}>
                <VisibilityOffIcon fontSize="small" />
              </ToggleButton>
            </ToggleButtonGroup>
          </Stack>
          <Stack gap={1} padding={1} position="absolute" top={0} right={0} zIndex={8}>
            <ToggleButton
              value="check"
              selected={cluastering}
              onChange={() => setCluastering(!cluastering)}
              size="small"
              sx={{ backgroundColor: 'rgba(255, 255, 255, 0.8)' }}
            >
              <WorkspacesIcon />
            </ToggleButton>
          </Stack>
          <KakaoMap
            ref={mapRef}
            defaultCenter={defaultCenter}
            autoFocus="path"
            height="100%"
            clustering={cluastering}
            clusterGridSize={50}
          >
            {places.map((place) => {
              const isInCurrentRoute = currentRoute?.placeIds.includes(place.id) ?? false;
              const orderInRoute = currentRoute?.placeIds.indexOf(place.id) ?? -1;

              if (!isVisibleOtherMarkers && !isInCurrentRoute) {
                return null;
              }

              return (
                <KakaoMap.Marker
                  key={place.id}
                  label={isInCurrentRoute ? `${orderInRoute + 1}. ${place.name}` : place.name}
                  variant={isInCurrentRoute ? 'selected' : 'disabled'}
                  color={isInCurrentRoute && place.category ? PlaceCategoryColorCode[place.category] : undefined}
                  onClick={async () => {
                    if (isInCurrentRoute) {
                      return setFocusedId(place.id)
                    }
                    if (await confirm('경로에 추가하시겠어요?')) {
                      update({
                        routeId: currentRoute.id,
                        placeIds: [...currentRoute.placeIds, place.id]
                      })
                    }
                  }}
                  {...place}
                />
              )
            })}
            {routes.map((route, index) => (
              <RoutePath
                key={route.id}
                waypoints={route.places}
                color={getRouteColor(index)}
                isSelected={route.id === currentRoute?.id}
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
          slotProps={{
            body: {
              sx: { scrollBehavior: 'smooth', scrollMarginTop: 60 }
            }
          }}
        >
          <Tabs
            value={selectedDate}
            sx={{
              position: 'sticky', top: 0, backgroundColor: '#fff', zIndex: 20,
              minHeight: 24,
              height: 40,
              overflow: "hidden",
            }}
            slotProps={{
              list: { sx: { height: '100%' } },
            }}
          >
            {tripDates.map((date) => (
              <Tab
                key={date}
                value={date}
                label={formatDate(date)}
                onClick={() => {
                  setSelectedDate(date)
                  setSelectedRouteId(null)
                }}
                sx={{ flex: 1, minHeight: 40 }}
              />
            ))}
          </Tabs>
          <Stack gap={1} sx={{ p: 1.5 }}>
            {/* 경로 선택 & 추가 */}
            <Stack direction="row" spacing={0.5} mb={1.5} alignItems="center">
              {routes.map((route, index) => (
                <Chip
                  key={route.id}
                  label={`경로 ${index + 1}`}
                  variant={currentRoute?.id === route.id ? 'filled' : 'outlined'}
                  color={currentRoute?.id === route.id ? 'primary' : 'default'}
                  size="small"
                  sx={{ fontSize: 11 }}
                  onClick={() => setSelectedRouteId(route.id)}
                  onDelete={async () => {
                    if (await confirm('정말로 삭제하시겠어요?')) {
                      removeRoute(route.id)
                      if (currentRoute?.id === route.id) {
                        setSelectedRouteId(null)
                      }
                    }
                  }}
                />
              ))}
              <IconButton
                size="small"
                onClick={() => {
                  createRoute({
                    tripId,
                    name: `${formatDate(selectedDate)} 경로 ${routes.length + 1}`,
                    scheduledDate: selectedDate,
                  })
                }}
                color="primary"
                sx={{ p: 0.5 }}
              >
                <AddIcon fontSize="small" />
              </IconButton>
              <Box flex={1} />
            </Stack>

            {currentRoute.places.length === 0 ? (
              <Typography variant="caption" color="text.secondary">
                지도에서 장소를 클릭하여 경로에 추가하세요
              </Typography>
            ) : (
              <Stack spacing={0.5}>
                <SortableList
                  items={currentRoute.places}
                  onSort={(changed) => {
                    update({ routeId: currentRoute.id, placeIds: changed.items.map(x => x.id) })
                  }}
                  renderItem={(place, idx) => (
                    <ListItem.Button
                      sx={{ scrollMarginTop: 50 }}
                      leftAddon={(
                        <SortableItem.Handle id={place.id}>
                          <DragIndicatorIcon />
                        </SortableItem.Handle>
                      )}
                      rightAddon={(
                        <Box flexShrink={0}>
                          <IconButton size="small" onClick={async () => {
                            const updated = await getUpdatedPlace({ tripId, placeId: place.id, defaultValues: place });
                            if (updated) {
                              updatePlace({
                                ...updated,
                                placeId: place.id,
                                category: updated.category || undefined, tags: updated.tags
                              })
                            }
                          }}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={async (event) => {
                              event.stopPropagation();
                              if (!currentRoute || !(await confirm('정말로 삭제하시겠어요?'))) return
                              const newPlaceIds = currentRoute.placeIds.filter((id) => id !== place.id)
                              update({ routeId: currentRoute.id, placeIds: newPlaceIds })
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      )}
                      onClick={() => mapRef.current?.panTo(place.lat, place.lng)}
                      focused={focusedId === place.id}
                    >
                      <Stack direction="row" alignItems="center" gap={0.5}>
                        <Dot>{idx + 1}</Dot>
                        <ListItem.Title>{place.name}</ListItem.Title>
                      </Stack>
                      <Box>
                        {place.address && (
                          <ListItem.Text variant="body2" color="text.secondary" fontSize={12}>
                            {place.address}
                          </ListItem.Text>
                        )}
                        {place.memo && (
                          <ListItem.Text variant="body2" color="text.secondary" fontSize={12}>
                            {place.memo}
                          </ListItem.Text>
                        )}

                        <NoteEditor
                          notes={place.routeNotes ?? []}
                          onChange={(memos) => updateNotes({ placeId: place.id, routeId: currentRoute.id, memos })}
                          action="dialog"
                          marginTop={1}
                        />
                      </Box>
                    </ListItem.Button>
                  )}
                />
              </Stack>
            )}
          </Stack>
        </DraggableBottomSheet>
      </Box>
      <BottomArea position="relative">
        <Button
          size="large"
          variant="contained"
          onClick={() => {
            overlay.open(({ isOpen, close }) => (
              <PlaceSelectSheet
                isOpen={isOpen}
                onClose={close}
                places={places}
                selectedPlaceIds={currentRoute?.placeIds ?? []}
                onConfirm={(placeIds) => {
                  if (!currentRoute || placeIds.length === 0) return
                  const newPlaceIds = [...currentRoute.placeIds, ...placeIds]
                  update({ routeId: currentRoute.id, placeIds: newPlaceIds })
                }}
              />
            ))
          }}
          sx={{ fontSize: 12 }}
          fullWidth
          disabled={!currentRoute}
        >
          장소 추가
        </Button>
      </BottomArea>

    </>
  )
}

const Dot = styled(Box)(({ theme }) => ({
  minWidth: 18,
  minHeight: 18,
  borderRadius: '50%',
  backgroundColor: theme.palette.primary.main,
  color: 'white',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 10,
  fontWeight: 'bold',
  flexShrink: 0,
}))


interface RoutePathProps {
  waypoints: { lat: number; lng: number }[] | undefined
  color: string
  isSelected: boolean
}

function RoutePath({ waypoints, color, isSelected }: RoutePathProps) {
  const coordinates = useRoadPath(waypoints)

  if (!coordinates || coordinates.length < 2) return null

  return (
    <KakaoMap.Path
      coordinates={coordinates}
      strokeColor={color}
      strokeWeight={isSelected ? 5 : 3}
      strokeOpacity={isSelected ? 1 : 0.6}
    />
  )
}
