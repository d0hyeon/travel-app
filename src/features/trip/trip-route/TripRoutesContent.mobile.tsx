import MyLocationIcon from '@mui/icons-material/MyLocation';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import WorkspacesIcon from '@mui/icons-material/Workspaces';
import { Box, Button, IconButton, ListItemIcon, Menu, MenuItem, Stack, styled, Tab, Tabs, ToggleButton, Typography } from "@mui/material";
import { Fragment, Suspense, useMemo, useRef, useState } from "react";
import { BottomArea } from '~shared/components/BottomArea';
import { useVariation } from '~shared/hooks/extends/useVariation';
import { useQueryParamState } from '~shared/hooks/urls/useQueryParamState';
import { BottomSheet } from "../../../shared/components/bottom-sheet/BottomSheet";
import { SortableList } from "../../../shared/components/dnd/SortableList";
import { Map, type MapRef } from "../../../shared/components/Map";
import { useCurrentCoordinate } from "../../../shared/hooks/env/useCurrentCoordinate";
import { usePointerPosition } from "../../../shared/hooks/interaction/usePointerPosition";
import { useOverlay } from "../../../shared/hooks/useOverlay";
import { formatDisplayDate, formatShortDate } from "../../../shared/utils/formats";
import { PlaceCategoryColorCode, type TripPlace } from "../../place/place.types";
import { useTripPlaces } from "../trip-place/useTripPlaces";
import { useTrip } from '../useTrip';
import { RoutePath } from "./components/RoutePath";
import { TripRoutePlaceListItem } from "./components/TripRoutePlaceListItem";
import { TripRouteSelector } from "./components/TripRouteSelector";
import { PlaceSelectSheet } from "./PlaceSelectSheet";
import { RouteLegItem } from './RouteTimeline';
import { useDayTripRoutes } from './useDayTripRoutes';
import { usePlaceFormOverlay } from './usePlaceFormOverlay';
import { useRouteLegs } from './useRouteLegs';
import { useTripViewConfig } from './useTripViewConfig';

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

  const [viewConfig, setViewConfig] = useTripViewConfig();
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
      setIsInitialed(true);
    }
  });

  const mapRef = useRef<MapRef>(null);
  const overlay = useOverlay()

  // 마커 클릭 메뉴: 지도 마커는 DOM 앵커를 주지 않으므로, 마지막 터치 좌표(getPosition)에 메뉴를 띄운다
  const { containerProps: pointerTracker, getPosition } = usePointerPosition<HTMLDivElement>();
  const [selectedPlace, setSelectedPlace] = useState<TripPlace | null>(null);

  const editPlace = async (place: TripPlace) => {
    const updated = await getUpdatedPlace({ tripId, placeId: place.id, defaultValues: place });
    if (updated) {
      updatePlace({
        ...updated,
        id: place.id,
        category: updated.category || undefined,
        tags: updated.tags,
      })
    }
  }

  const toggleRoutePlace = (place: TripPlace) => {
    if (!currentRoute) return
    const isInRoute = currentRoute.placeIds.includes(place.id)
    const placeIds = isInRoute
      ? currentRoute.placeIds.filter((id) => id !== place.id)
      : [...currentRoute.placeIds, place.id]
    update({ routeId: currentRoute.id, placeIds })
  }

  const isMenuPlaceInRoute = selectedPlace ? (currentRoute?.placeIds.includes(selectedPlace.id) ?? false) : false

  return (
    <>
      <Box sx={{ flex: 1, position: 'relative' }}>
        {/* Map (전체) */}
        <Box
          sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: `calc(${sheetRatio * 100}% - 10px)` }}
          {...pointerTracker}
        >
          <FloatingControl sx={{ top: 0, left: 0 }}>
            <ToggleButton
              value="check"
              aria-label="경로 마커만 표시"
              onClick={() => setViewConfig({ isVisibleAllMarkers: !viewConfig.isVisibleAllMarkers })}
              selected={viewConfig.isVisibleAllMarkers}
              size="small"
              color="primary"
              sx={{ backgroundColor: 'rgba(255, 255, 255, 0.7) !important' }}
            >
              <VisibilityOffIcon fontSize="small" />
            </ToggleButton>
          </FloatingControl>
          <FloatingControl sx={{ top: 0, right: 0 }}>
            <ToggleButton
              value="check"
              selected={viewConfig.isCluasterlingView}
              onChange={() => setViewConfig({ isCluasterlingView: !viewConfig.isCluasterlingView })}
              size="small"
              color="primary"
              sx={{ backgroundColor: 'rgba(255, 255, 255, 0.7) !important' }}
            >
              <WorkspacesIcon />
            </ToggleButton>
          </FloatingControl>
          <FloatingControl sx={{ bottom: 8, right: 0 }}>
            {currentCoordinate && (
              <IconButton
                onClick={() => mapRef.current?.panTo(currentCoordinate.lat, currentCoordinate.lng)}
                size="small"
                sx={{ backgroundColor: 'rgba(255, 255, 255, 0.7) !important' }}
              >
                <MyLocationIcon />
              </IconButton>
            )}
          </FloatingControl>
          <Map
            type={trip.isOverseas ? 'google' : 'kakao'}
            ref={mapRef}
            defaultCenter={currentCoordinate ?? { lat: trip.lat, lng: trip.lng }}
            autoFocus="path"
            height="100%"
            clustering={viewConfig.isCluasterlingView}
            clusterGridSize={50}
          >
            {isOngoingTrip && currentCoordinate && (
              <Map.Marker variant="circle" {...currentCoordinate} />
            )}
            {places.map((place) => {
              const isInCurrentRoute = currentRoute?.placeIds.includes(place.id) ?? false;
              const orderInRoute = currentRoute?.placeIds.indexOf(place.id) ?? -1;

              if (viewConfig.isVisibleAllMarkers && !isInCurrentRoute) {
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
                    items={currentRoute.places}
                    onSort={(changed) => {
                      update({ routeId: currentRoute.id, placeIds: changed.items.map(x => x.id) })
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
                              tripId={tripId}
                              date={selectedDate}
                              routeId={currentRoute.id}
                              placeId={place.id}
                              order={idx + 1}
                              focused={focusedId === place.id}
                              onFocus={() => mapRef.current?.panTo(place.lat, place.lng)}
                            />
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
          <MenuItem
            onClick={() => {
              if (selectedPlace) editPlace(selectedPlace)
              setSelectedPlace(null)
            }}
          >
            <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
            장소 수정
          </MenuItem>
          {currentRoute && (
            <MenuItem
              onClick={() => {
                if (selectedPlace) toggleRoutePlace(selectedPlace)
                setSelectedPlace(null)
              }}
            >
              <ListItemIcon>
                {isMenuPlaceInRoute
                  ? <RemoveCircleOutlineIcon fontSize="small" />
                  : <AddIcon fontSize="small" />}
              </ListItemIcon>
              {isMenuPlaceInRoute ? '경로 제거' : '경로 추가'}
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

const FloatingControl = styled(Stack)({
  position: 'absolute',
  zIndex: 8,
  gap: 8,
  padding: 8,
})
