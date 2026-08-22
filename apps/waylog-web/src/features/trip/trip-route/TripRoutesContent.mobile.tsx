import AddIcon from '@mui/icons-material/Add';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import EditIcon from '@mui/icons-material/Edit';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import VisibilityOnIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { Box, Button, IconButton, ListItemIcon, Menu, MenuItem, Stack, Tab, Tabs, Typography } from "@mui/material";
import { Fragment, startTransition, useMemo, useOptimistic, useRef, useState } from "react";
import { Dot } from 'recharts';
import { BottomArea } from '~shared/components/BottomArea';
import { ListItem } from '~shared/components/ListItem';
import { useVariation } from '@waylog/react';
import { useQueryParamState } from '~shared/hooks/urls/useQueryParamState';
import { assert } from '@waylog/utility';
import { BottomSheet } from "../../../shared/components/bottom-sheet/BottomSheet";
import { SortableItem } from "../../../shared/components/dnd/SortableItem";
import { SortableList } from "../../../shared/components/dnd/SortableList";
import { Map, type MapRef } from "../../../shared/components/Map";
import { useCurrentCoordinate } from "../../../shared/hooks/env/useCurrentCoordinate";
import { usePointerPosition } from "../../../shared/hooks/interaction/usePointerPosition";
import { useOverlay } from "../../../shared/hooks/useOverlay";
import { formatDisplayDate, formatShortDate } from "@waylog/utility";
import { PlaceCategoryColorCode, type TripPlace } from '@waylog/domains/place';
import { TripMarineActivityMapMarkers } from '../trip-marine-activity/TripMarineActivityMapMarkers';
import { useTripPlaces } from '@waylog/domains/trip';
import { TripWeatherIconButton } from '../trip-weather/TripWeatherIconButton';
import { useTrip } from '@waylog/domains/trip';
import { FloatingControl } from "./components/FloatingControl";
import { RoutePath } from "./components/RoutePath";
import { TripRouteMapFloatingControls } from './components/TripRouteMapFloatingControls';
import { TripRoutePlaceListItem } from "./components/TripRoutePlaceListItem";
import { TripRouteSelector } from "./components/TripRouteSelector";
import { findNearestPlace } from '@waylog/domains/trip';
import { PlaceSelectSheet } from "./PlaceSelectSheet";
import { NoteEditor } from './RouteNoteList';
import { RouteLegItem } from './RouteTimeline';
import { useDayTripRoutes } from '@waylog/domains/trip';
import { usePlaceFormOverlay } from './usePlaceFormOverlay';
import { useRouteLegs } from './useRouteLegs';
import { useTripViewConfigValue } from './useTripViewConfig';

// 경로별 색상 팔레트
const ROUTE_COLORS = ['#1976d2', '#e53935', '#43a047', '#fb8c00', '#8e24aa', '#00acc1']

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
  const { data: allPlaces, update: updatePlace } = useTripPlaces(tripId)

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
    toggleVisible,
    updateNotes
  } = useDayTripRoutes({ tripId, date: selectedDate });


  const [selectedRouteId, setSelectedRouteId] = useQueryParamState<string | null>('route-id', {
    defaultValue: routes?.[0]?.id ?? null
  })

  const currentRoute = useMemo(() => {
    if (selectedRouteId) return routes.find((r) => r.id === selectedRouteId) ?? routes[0];
    return routes[0];
  }, [routes, selectedRouteId])

  const visiblePlaces = useMemo(
    () => currentRoute?.places.filter(x => !currentRoute.hiddenPlaces.includes(x.id)) ?? [],
    [currentRoute],
  )
  const legByArrivalPlaceId = useRouteLegs(visiblePlaces)

  const { openBottomsheet: getUpdatedPlace } = usePlaceFormOverlay();

  const viewConfig = useTripViewConfigValue();
  const [sheetRatio, setSheetRatio] = useState(DEFAULT_BOTTOM_SHEET_RATIO);
  const [focusedId, setFocusedId] = useState<string | null>(null)

  const today = formatDisplayDate(new Date());
  const isOngoingTrip = trip.startDate <= today && today <= trip.endDate

  const [getIsInitialed, setIsInitialed] = useVariation(false);
  const currentCoordinate = useCurrentCoordinate({
    enabled: isOngoingTrip,
    onChange: (coordinate) => {
      if (getIsInitialed()) return;
      mapRef.current?.panTo(coordinate.lat, coordinate.lng);
      if (selectedDate === today) {
        const nearestPlace = findNearestPlace(coordinate, currentRoute?.places ?? []);
        if (nearestPlace) setFocusedId(nearestPlace.id);
      }
      setIsInitialed(true);
    }
  });

  const mapRef = useRef<MapRef>(null);
  const overlay = useOverlay()

  // 마커 클릭 메뉴: 지도 마커는 DOM 앵커를 주지 않으므로, 마지막 터치 좌표(getPosition)에 메뉴를 띄운다
  const { containerProps: pointerTracker, getPosition } = usePointerPosition<HTMLDivElement>();
  const [selectedPlace, setSelectedPlace] = useState<TripPlace | null>(null);
  const getIsInRoute = (place: TripPlace) => {
    assert(currentRoute != null, 'route가 설정되지 않았습니다.')
    return currentRoute?.placeIds.includes(place.id)
  };

  const [currentPlaces, setOptimisticCurrentPlaces] = useOptimistic(currentRoute.places);

  return (
    <>
      <Box sx={{ flex: 1, position: 'relative' }}>
        {/* Map (전체) */}
        <Box
          sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: `calc(${sheetRatio * 100}% - 10px)` }}
          {...pointerTracker}
        >
          <FloatingControl corner='top-left' zIndex={8}>
            <TripWeatherIconButton tripId={tripId} />
          </FloatingControl>
          <TripRouteMapFloatingControls />
          {currentCoordinate && (
            <FloatingControl corner="bottom-right" zIndex={8}>
              <IconButton
                onClick={() => mapRef.current?.panTo(currentCoordinate.lat, currentCoordinate.lng)}
                size="small"
                sx={{ backgroundColor: 'rgba(255, 255, 255, 0.7) !important' }}
              >
                <MyLocationIcon />
              </IconButton>
            </FloatingControl>
          )}
          <Map
            type={trip.isOverseas ? 'google' : 'kakao'}
            ref={mapRef}
            defaultCenter={currentCoordinate ?? { lat: trip.lat, lng: trip.lng }}
            autoFocus="path"
            height="100%"
            clustering={viewConfig.isCluasterlingView}
            clusterGridSize={50}
          >
            <TripMarineActivityMapMarkers tripId={trip.id} />
            {isOngoingTrip && currentCoordinate && (
              <Map.Marker variant="circle" {...currentCoordinate} />
            )}
            {allPlaces.map((place) => {
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
                  onClick={() => {
                    if (isInCurrentRoute) setFocusedId(place.id)
                    setSelectedPlace(place)
                  }}
                  {...place}
                />
              )
            })}

            {routes.map((route, index) => (
              <RoutePath
                key={route.id}
                waypoints={route.places.filter(x => !route.hiddenPlaces.includes(x.id))}
                color={getRouteColor(index)}
                isSelected={route.id === currentRoute?.id}
              />
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
          {tripDates.length > 1 && (
            <BottomSheet.Header>
              <Tabs
                value={selectedDate}
                sx={{ width: '100%', minHeight: 24, height: 40, overflow: "hidden" }}
                variant="scrollable"
                slotProps={{ list: { sx: { height: '100%' } } }}
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
          )}
          <BottomSheet.Body gap={1} sx={{ p: 1.5 }}>
            <BottomSheet.Scrollable>
              <TripRouteSelector.Chip
                tripId={tripId}
                date={selectedDate}
                value={currentRoute?.id}
                mb={1.5}
                onAdd={() => createRoute({
                  tripId,
                  name: `${formatShortDate(selectedDate)} 경로 ${routes.length + 1}`,
                  scheduledDate: selectedDate,
                })}
                onDelete={(id) => removeRoute(id)}
                onChange={(id) => setSelectedRouteId(id)}
              />

              {currentRoute.places.length === 0 ? (
                <Typography variant="caption" color="text.secondary">
                  지도에서 장소를 클릭하여 경로에 추가하세요
                </Typography>
              ) : (
                <Stack spacing={0.5}>
                  <SortableList
                    items={currentPlaces}
                    onSort={(changed) => {
                      startTransition(async () => {
                        setOptimisticCurrentPlaces(changed.items);
                        await update({ routeId: currentRoute.id, placeIds: changed.items.map(x => x.id) })
                      })
                    }}
                  >
                    {currentRoute.places.map((place, idx) => {
                      const inboundLeg = legByArrivalPlaceId.get(place.id)
                      return (
                        <Fragment key={place.id}>
                          {inboundLeg && inboundLeg.duration > 0 && (
                            <RouteLegItem leg={inboundLeg} paddingY={1} marginBottom={0.5} />
                          )}
                          <SortableList.Item id={place.id}>
                            <TripRoutePlaceListItem
                              data={place}
                              title={(
                                <Stack direction="row" alignItems="center" gap={0.5}>
                                  <Dot>{idx}</Dot>
                                  <ListItem.Title>{place.name}</ListItem.Title>
                                  <IconButton
                                    size="small"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      toggleVisible({ routeId: currentRoute.id, placeId: place.id });
                                    }}
                                  >
                                    {currentRoute.hiddenPlaces.includes(place.id)
                                      ? <VisibilityOffIcon fontSize="small" sx={{ opacity: 0.7 }} />
                                      : <VisibilityOnIcon fontSize="small" />}
                                  </IconButton>
                                </Stack>
                              )}
                              leftAddon={(
                                <SortableItem.Handle id={place.id}>
                                  <DragIndicatorIcon />
                                </SortableItem.Handle>
                              )}
                              rightAddon={(
                                <TripRoutePlaceListItem.Actions
                                  tripId={tripId}
                                  date={selectedDate}
                                  routeId={currentRoute.id}
                                  placeId={place.id}
                                />
                              )}
                              focused={focusedId === place.id}
                              onClick={() => mapRef.current?.panTo(place.lat, place.lng)}
                            >
                              <NoteEditor
                                notes={place.routeNotes ?? []}
                                onChange={(memos) => updateNotes({ placeId: place.id, routeId: currentRoute.id, memos })}
                                action="dialog"
                                marginTop={1}
                              />
                            </TripRoutePlaceListItem>
                          </SortableList.Item>
                        </Fragment>
                      )
                    })}
                  </SortableList>
                </Stack>
              )}
            </BottomSheet.Scrollable>
          </BottomSheet.Body>
        </BottomSheet>

        <Menu
          open={Boolean(selectedPlace)}
          onClose={() => setSelectedPlace(null)}
          anchorReference="anchorPosition"
          anchorPosition={getPosition() ?? undefined}
        >
          {selectedPlace && (
            <MenuItem
              onClick={async () => {
                setSelectedPlace(null)
                const updated = await getUpdatedPlace({ tripId, placeId: selectedPlace.id, defaultValues: selectedPlace });
                if (updated) await updatePlace({ ...selectedPlace, ...updated });

              }}
            >
              <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
              장소 수정
            </MenuItem>
          )}
          {selectedPlace && currentRoute && (
            <MenuItem
              onClick={async () => {
                setSelectedPlace(null)
                update({
                  routeId: currentRoute.id,
                  placeIds: getIsInRoute(selectedPlace)
                    ? currentRoute.placeIds.filter((id) => id !== selectedPlace.id)
                    : [...currentRoute.placeIds, selectedPlace.id]
                })
              }}
            >
              <ListItemIcon>
                {getIsInRoute(selectedPlace)
                  ? <RemoveCircleOutlineIcon fontSize="small" />
                  : <AddIcon fontSize="small" />}
              </ListItemIcon>
              {getIsInRoute(selectedPlace) ? '경로 제거' : '경로 추가'}
            </MenuItem>
          )}
        </Menu>
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
                  const mergedPlaceIds = Array.from(new Set([...currentRoute.placeIds, ...placeIds]))
                  update({ routeId: currentRoute.id, placeIds: mergedPlaceIds })
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
