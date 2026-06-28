import { Box, IconButton, Stack, styled, Typography } from '@mui/material'
import { Suspense, useMemo, useRef, useState } from 'react'
import { ListItem } from '~shared/components/ListItem'
import { SortableItem } from '../../../shared/components/dnd/SortableItem'
import { SortableList } from '../../../shared/components/dnd/SortableList'
import { Map, type MapRef } from '../../../shared/components/Map'
import { useQueryParamState } from '../../../shared/hooks/urls/useQueryParamState'
import { formatDisplayDate, formatShortDate } from '../../../shared/utils/formats'
import { PlaceCategoryColorCode } from '../../place/place.types'
import { useTripPlaceFormOverlay } from '../trip-place/trip-place-form/useTripPlaceFormOverlay'
import { useTripPlaces } from '../trip-place/useTripPlaces'
import { useTrip } from '../useTrip'
import { DragIcon } from './components/DragIcon'
import { RoutePath } from './components/RoutePath'
import { TripDateToggleGroup } from './components/TripDateToggleGroup'
import { TripRutePlaceAddButton } from './components/TripRoutePlaceAddButton'
import { TripRoutePlaceItem } from './components/TripRoutePlaceItem'
import { TripRouteSelector } from './components/TripRouteSelector'
import { Dot, RouteLegItem } from './RouteTimeline'
import { useDayTripRoutes } from './useDayTripRoutes'
import { useRouteLegs } from './useRouteLegs'

import VisibilityOnIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import { TripRouteMapFloatingControls } from './components/TripRouteMapFloatingControls'
import { NoteEditor } from './RouteNoteList'
import { useTripViewConfigValue } from './useTripViewConfig'

// 경로별 색상 팔레트
const ROUTE_COLORS = ['#1976d2', '#e53935', '#43a047', '#fb8c00', '#8e24aa', '#00acc1']

function getRouteColor(index: number): string {
  return ROUTE_COLORS[index % ROUTE_COLORS.length]
}

interface TripRoutesContentProps {
  tripId: string
}

export function TripRoutesContent({ tripId }: TripRoutesContentProps) {
  const { data: trip } = useTrip(tripId);
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
    data: { routes },
    create: createRoute,
    update,
    remove: removeRoute,
    toggleVisible,
    updateNotes
  } = useDayTripRoutes({ tripId, date: selectedDate })
  const { data: places } = useTripPlaces(tripId)

  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(routes?.[0].id ?? null);

  const currentRoute = useMemo(() => {
    if (selectedRouteId) {
      return routes.find((r) => r.id === selectedRouteId) ?? routes[0] ?? null
    }
    return routes[0] ?? null
  }, [routes, selectedRouteId])

  const visiblePlaces = useMemo(
    () => currentRoute?.places.filter(x => !currentRoute.hiddenPlaces.includes(x.id)) ?? [],
    [currentRoute],
  )
  const legByArrivalPlaceId = useRouteLegs(visiblePlaces)

  const detailOverlay = useTripPlaceFormOverlay();

  const mapViewConfig = useTripViewConfigValue();
  const mapRef = useRef<MapRef>(null)

  return (
    <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      {/* Left: List */}
      <SidePanel>
        <Stack height="100%">
          <Stack gap={2} flex="1 1 100%" paddingBottom={5}>
            <TripDateToggleGroup
              tripId={tripId}
              value={selectedDate}
              onChange={(date) => {
                setSelectedDate(date)
                setSelectedRouteId(null)
              }}
            />

            <TripRouteSelector.Chip
              tripId={tripId}
              date={selectedDate}
              value={currentRoute?.id}
              onAdd={() => createRoute({
                tripId,
                name: `${formatShortDate(selectedDate)} 경로 ${routes.length + 1}`,
                scheduledDate: selectedDate,
              })}
              onDelete={(id) => removeRoute(id)}
              onChange={(id) => setSelectedRouteId(id)}
            />

            <Typography variant="subtitle2" color="text.secondary">
              {currentRoute ? `${currentRoute.name} (${currentRoute.places.length}개 장소)` : '경로가 없습니다'}
            </Typography>

            {currentRoute.places.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                지도에서 장소를 클릭하여 경로에 추가하세요
              </Typography>
            ) : (
              <Stack spacing={1}>
                <SortableList
                  items={currentRoute.places}
                  onSort={(changed) => update({ routeId: currentRoute.id, placeIds: changed.items.map(x => x.id) })}
                >
                  {currentRoute.places.map((place, idx) => {
                    const inboundLeg = legByArrivalPlaceId.get(place.id)
                    const isHidden = currentRoute.hiddenPlaces.includes(place.id);

                    return (
                      <Stack key={place.id} gap={1}>
                        {inboundLeg && inboundLeg.duration > 0 && (
                          <RouteLegItem leg={inboundLeg} paddingY={1} />
                        )}
                        <SortableList.Item id={place.id}>
                          <TripRoutePlaceItem
                            data={place}
                            onClick={() => mapRef.current?.panTo(place.lat, place.lng)}
                            title={
                              <ListItem.Title
                                leftAddon={<Dot>{idx + 1}</Dot>}
                                rightAddon={(
                                  <IconButton
                                    size="small"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      toggleVisible({ routeId: currentRoute.id, placeId: place.id });
                                    }}
                                  >
                                    {isHidden ? <VisibilityOffIcon fontSize="small" sx={{ opacity: 0.7 }} /> : <VisibilityOnIcon fontSize="small" />}
                                  </IconButton>
                                )}
                              >
                                {place.name}
                              </ListItem.Title>
                            }
                            leftAddon={(
                              <SortableItem.Handle id={place.id}>
                                <DragIcon />
                              </SortableItem.Handle>
                            )}
                            rightAddon={(
                              <TripRoutePlaceItem.Actions
                                tripId={tripId}
                                date={selectedDate}
                                routeId={currentRoute.id}
                                placeId={place.id}
                              />
                            )}
                          >
                            <NoteEditor
                              notes={place.routeNotes ?? []}
                              onChange={(memos) => updateNotes({ placeId: place.id, routeId: currentRoute.id, memos })}
                            />
                          </TripRoutePlaceItem>
                        </SortableList.Item>
                      </Stack>
                    )
                  })}
                </SortableList>
              </Stack>
            )}
          </Stack>
          <BottomBar>
            <TripRutePlaceAddButton tripId={tripId} />
          </BottomBar>
        </Stack>
      </SidePanel>

      {/* Right: Map */}
      <Box sx={{ flex: 1, position: 'relative' }}>
        <TripRouteMapFloatingControls />
        <Map
          type={trip.isOverseas ? 'google' : 'kakao'}
          ref={mapRef}
          defaultCenter={trip}
          autoFocus="path"
          height="100%"
          clustering={mapViewConfig.isCluasterlingView}
          clusterGridSize={60}
        >
          {places.map((place) => {
            if (currentRoute.hiddenPlaces.includes(place.id)) return null

            const isInCurrentRoute = currentRoute?.placeIds.includes(place.id) ?? false
            const orderInRoute = currentRoute?.placeIds.indexOf(place.id) ?? -1
            if (!isInCurrentRoute && !mapViewConfig.isVisibleAllMarkers) return null

            return (
              <Map.Marker
                key={place.id}
                label={isInCurrentRoute ? `${orderInRoute + 1}. ${place.name}` : place.name}
                color={isInCurrentRoute && place.category ? PlaceCategoryColorCode[place.category] : undefined}
                onContextMenu={() => detailOverlay.openDialog({ placeId: place.id, tripId })}
                onClick={() => {
                  if (currentRoute == null) {
                    return createRoute({
                      tripId,
                      name: `${formatShortDate(selectedDate)} 경로 ${routes.length + 1}`,
                      placeIds: [place.id],
                    })
                  }
                  const newPlaceIds = isInCurrentRoute
                    ? currentRoute.placeIds.filter((id) => id !== place.id)
                    : [...currentRoute.placeIds, place.id]
                  update({ routeId: currentRoute.id, placeIds: newPlaceIds })
                }}
                tooltip={[place.name, place.address, place.memo ?? ''].filter(Boolean)}
                {...place}
              />
            )
          })}
          <Suspense>
            {routes.map((route, index) => (
              <RoutePath
                key={route.id}
                waypoints={route.places.filter(x => !route.hiddenPlaces.includes(x.id))}
                color={getRouteColor(index)}
                isSelected={route.id === currentRoute?.id}
              />
            ))}
          </Suspense>
        </Map>
      </Box>
    </Box>
  )
}

const SidePanel = styled(Stack)(({ theme }) => ({
  width: '30%',
  borderRight: `1px solid ${theme.palette.divider}`,
  overflow: 'auto',
  padding: theme.spacing(2),
}))

const BottomBar = styled(Box)({
  padding: 8,
  flex: '0 0 auto',
  position: 'sticky',
  bottom: 0,
  background: '#fff',
  zIndex: 10
})
