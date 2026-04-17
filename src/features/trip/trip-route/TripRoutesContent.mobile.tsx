import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityOnIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import WorkspacesIcon from '@mui/icons-material/Workspaces';
import { Box, Button, Chip, IconButton, Stack, styled, Tab, Tabs, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import { Suspense, useMemo, useRef, useState } from "react";
import { BottomArea } from '~shared/components/BottomArea';
import { useConfirmDialog } from '~shared/components/confirm-dialog/useConfirmDialog';
import { useQueryParamState } from '~shared/hooks/urls/useQueryParamState';
import { BottomSheet } from "../../../shared/components/bottom-sheet/BottomSheet";
import { ListItem } from "../../../shared/components/ListItem";
import { Map, type MapRef } from "../../../shared/components/Map";
import { PopMenu } from "../../../shared/components/PopMenu";
import { SortableItem } from "../../../shared/components/dnd/SortableItem";
import { SortableList } from "../../../shared/components/dnd/SortableList";
import { useCurrentLocation } from "../../../shared/hooks/env/useCurrentLocation";
import { useOverlay } from "../../../shared/hooks/useOverlay";
import { formatShortDate, formatDisplayDate } from "../../../shared/utils/formats";
import { PlaceCategoryColorCode } from "../../place/place.types";
import { useRoadRoute } from "../../route/road-route/useRoadRoute";
import { useTripPlaces } from "../trip-place/useTripPlaces";
import { useTrip } from '../useTrip';
import { PlaceSelectSheet } from "./PlaceSelectSheet";
import { NoteEditor } from './RouteNoteList';
import { useDayTripRoutes } from './useDayTripRoutes';
import { usePlaceFormOverlay } from './usePlaceFormOverlay';
import CenterFocusWeakIcon from '@mui/icons-material/CenterFocusWeak';
import { useTripViewConfig } from './useTripViewConfig';

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
}

const BOTTOM_SHEET_RATIOS = [0.25, 0.5, 0.8, 1] as const;
const DEFAULT_BOTTOM_SHEET_RATIO = 0.5 satisfies typeof BOTTOM_SHEET_RATIOS[number];

export default function TripRoutesContent({ tripId }: RouteContentProps) {

  const { data: trip } = useTrip(tripId);
  const { data: places, update: updatePlace } = useTripPlaces(tripId)

  const [selectedDate, setSelectedDate] = useQueryParamState<string>('days', {
    defaultValue: () => {
      const today = new Date().toISOString().split('T')[0]
      if (today >= trip.startDate && today <= trip.endDate) {
        return formatDisplayDate(today)
      }
      return formatDisplayDate(trip.startDate)
    }
  })
  const {
    data: { routes, tripDates },
    create: createRoute,
    update,
    remove: removeRoute,
    updateNotes,
    toggleVisible
  } = useDayTripRoutes({ tripId, date: selectedDate });


  const [selectedRouteId, setSelectedRouteId] = useQueryParamState<string | null>('route-id', {
    defaultValue: routes?.[0]?.id ?? null
  })

  const currentRoute = useMemo(() => {
    if (selectedRouteId) return routes.find((r) => r.id === selectedRouteId) ?? routes[0];
    return routes[0];
  }, [routes, selectedRouteId])

  const { openBottomsheet: getUpdatedPlace } = usePlaceFormOverlay();

  const [viewConfig, setViewConfig] = useTripViewConfig();
  const [sheetRatio, setSheetRatio] = useState(DEFAULT_BOTTOM_SHEET_RATIO);
  const [focusedId, setFocusedId] = useState<string | null>(null)

  const today = formatDisplayDate(new Date());
  const isOngoingTrip = trip.startDate <= today && today <= trip.endDate
  const currentLocation = useCurrentLocation({ enabled: isOngoingTrip });


  const mapRef = useRef<MapRef>(null);
  const overlay = useOverlay()
  const confirm = useConfirmDialog();
  console.log(viewConfig.isVisibleAllMarkers)

  return (
    <>
      <Box sx={{ flex: 1, position: 'relative' }}>
        {/* Map (전체) */}
        <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: `calc(${sheetRatio * 100}% - 10px)` }}>
          <Stack gap={1} padding={1} position="absolute" top={0} left={0} zIndex={8}>
            <ToggleButtonGroup
              orientation="vertical"
              value={viewConfig.isVisibleAllMarkers}
              exclusive
              size="small"
              sx={{ backgroundColor: 'rgba(255, 255, 255, 0.8)' }}
            >
              <ToggleButton value={true} aria-label="list" onClick={() => setViewConfig({ isVisibleAllMarkers: true })}>
                <VisibilityOnIcon fontSize="small" />
              </ToggleButton>
              <ToggleButton value={false} aria-label="module" onClick={() => setViewConfig({ isVisibleAllMarkers: false })}>
                <VisibilityOffIcon fontSize="small" />
              </ToggleButton>
            </ToggleButtonGroup>
          </Stack>
          <Stack gap={1} padding={1} position="absolute" top={0} right={0} zIndex={8}>
            <ToggleButton
              value="check"
              selected={viewConfig.isCluasterlingView}
              onChange={() => setViewConfig({ isCluasterlingView: !viewConfig.isCluasterlingView })}
              size="small"
              sx={{ backgroundColor: 'rgba(255, 255, 255, 0.8)' }}
            >
              <WorkspacesIcon />
            </ToggleButton>
          </Stack>
          <Stack gap={1} padding={1} position="absolute" bottom={8} right={0} zIndex={8}>
            <IconButton
              onClick={() => mapRef.current?.focus()}
              size="small"
              sx={{ backgroundColor: 'rgba(255, 255, 255, 0.8)' }}
            >
              <CenterFocusWeakIcon />
            </IconButton>
          </Stack>
          <Map
            type={trip.isOverseas ? 'google' : 'kakao'}
            ref={mapRef}
            defaultCenter={{ lat: trip.lat, lng: trip.lng }}
            center={currentLocation ?? undefined}
            autoFocus="path"
            height="100%"
            clustering={viewConfig.isCluasterlingView}
            clusterGridSize={50}
          >
            {isOngoingTrip && currentLocation && (
              <Map.Marker variant="circle" {...currentLocation} />
            )}
            {places.map((place) => {
              const isInCurrentRoute = currentRoute?.placeIds.includes(place.id) ?? false;
              const orderInRoute = currentRoute?.placeIds.indexOf(place.id) ?? -1;

              if (!viewConfig.isVisibleAllMarkers && !isInCurrentRoute) {
                return null;
              }

              return (
                <Map.Marker
                  key={place.id}
                  label={isInCurrentRoute ? `${orderInRoute + 1}. ${place.name}` : place.name}
                  color={isInCurrentRoute && place.category ? PlaceCategoryColorCode[place.category] : "disabled"}
                  onClick={async () => {
                    if (isInCurrentRoute) {
                      return setFocusedId(place.id)
                    }

                    const updated = await getUpdatedPlace({
                      tripId,
                      placeId: place.id,
                      defaultValues: place,
                      header: ({ onClose }) => {
                        const handleAddRoute = () => {
                          const payload = { routeId: currentRoute.id, placeIds: [...currentRoute.placeIds, place.id] };
                          update(payload, { onSuccess: onClose })
                        }
                        return (
                          <BottomSheet.Header rightElement={<Button onClick={handleAddRoute} size="small" variant="outlined">경로 추가</Button>}>
                            <Typography variant="h6">{place.name}</Typography>
                          </BottomSheet.Header>
                        )
                      }
                    });

                    if (updated) {
                      updatePlace({
                        ...updated,
                        placeId: place.id,
                        category: updated.category || undefined, tags: updated.tags
                      })
                    }
                  }}
                  {...place}
                />
              )
            })}

            {routes.map((route, index) => (
              <Suspense key={route.id}>
                <RoutePath
                  key={route.id}
                  waypoints={route.places.filter(x => !route.hiddenPlaces.includes(x.id))}
                  color={getRouteColor(index)}
                  isSelected={route.id === currentRoute?.id}
                />
              </Suspense>
            ))}
          </Map>
        </Box>

        {/* Bottom Sheet */}
        <BottomSheet
          snapPoints={BOTTOM_SHEET_RATIOS}
          defaultSnapIndex={BOTTOM_SHEET_RATIOS.indexOf(DEFAULT_BOTTOM_SHEET_RATIO)}
          onSnapChange={(ratio) => {
            if (ratio < 1 && ratio !== sheetRatio) {
              setSheetRatio(ratio)
              setTimeout(() => mapRef.current?.relayout(), 350)
            }
          }}
        >
          <BottomSheet.Header>
            <Tabs
              value={selectedDate}
              sx={{
                width: '100%',
                minHeight: 24,
                height: 40,
                overflow: "hidden",
              }}
              variant="scrollable"
              slotProps={{
                list: { sx: { height: '100%' } },
              }}
            >
              {tripDates.map((date) => (
                <Tab
                  key={date}
                  value={date}
                  label={formatShortDate(date)}
                  onClick={() => {
                    setSelectedDate(date)
                    setSelectedRouteId(null)
                  }}
                  sx={{ flex: 1, minHeight: 40 }}
                />
              ))}
            </Tabs>
          </BottomSheet.Header>
          <BottomSheet.Body gap={1} sx={{ p: 1.5 }}>
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
                    name: `${formatShortDate(selectedDate)} 경로 ${routes.length + 1}`,
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
                        <PlaceMenu
                          onEdit={async () => {
                            const updated = await getUpdatedPlace({ tripId, placeId: place.id, defaultValues: place });
                            if (updated) {
                              updatePlace({
                                ...updated,
                                placeId: place.id,
                                category: updated.category || undefined, tags: updated.tags
                              })
                            }
                          }}
                          onDelete={async () => {
                            if (!currentRoute || !(await confirm('정말로 삭제하시겠어요?'))) return
                            const newPlaceIds = currentRoute.placeIds.filter((id) => id !== place.id)
                            update({ routeId: currentRoute.id, placeIds: newPlaceIds })
                          }}
                        />
                      )}
                      onClick={() => mapRef.current?.panTo(place.lat, place.lng)}
                      focused={focusedId === place.id}
                    >
                      <Stack direction="row" alignItems="center" gap={0.5}>
                        <Dot>{idx + 1}</Dot>
                        <ListItem.Title>{place.name}</ListItem.Title>
                        <IconButton
                          size="small"
                          sx={{}}
                          onClick={(event) => {
                            event.stopPropagation();
                            toggleVisible({ routeId: currentRoute.id, placeId: place.id })
                          }}
                        >
                          {currentRoute.hiddenPlaces.includes(place.id) ? <VisibilityOffIcon fontSize="small" sx={{ opacity: 0.7 }} /> : <VisibilityOnIcon fontSize="small" />}
                        </IconButton>
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
          </BottomSheet.Body>
        </BottomSheet>
      </Box>
      <BottomArea position="static">
        <Button
          size="large"
          variant="contained"
          onClick={() => {
            overlay.open(({ isOpen, close }) => (
              <PlaceSelectSheet
                isOpen={isOpen}
                onClose={close}
                tripId={tripId}
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
  waypoints: { lat: number; lng: number }[]
  color: string
  isSelected: boolean;
}

interface PlaceMenuProps {
  onEdit: () => void
  onDelete: () => void
}

function PlaceMenu({ onEdit, onDelete }: PlaceMenuProps) {
  return (
    <PopMenu
      items={
        <>
          <PopMenu.Item onClick={onEdit} icon={<EditIcon fontSize="small" sx={{ mr: 1 }} />}>
            수정
          </PopMenu.Item>
          <PopMenu.Item onClick={onDelete} icon={<DeleteIcon fontSize="small" sx={{ mr: 1 }} />} sx={{ color: 'error.main' }}>
            삭제
          </PopMenu.Item>
        </>
      }
    />
  )
}

function RoutePath({ waypoints, color, isSelected }: RoutePathProps) {
  const coordinates = useRoadRoute({ waypoints })

  if (!coordinates || coordinates.length < 2) return null

  return (
    <Map.Path
      coordinates={coordinates}
      strokeColor={color}
      strokeWeight={isSelected ? 5 : 3}
      strokeOpacity={isSelected ? 1 : 0.6}
    />
  )
}
