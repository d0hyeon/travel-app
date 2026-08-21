import { findNearestPlace } from '@waylog/domains/trip'
import { formatDisplayDate, formatShortDate } from '@waylog/domains/utils'
import { useDayTripRoutes, useTrip, useTripPlaces } from '@waylog/domains/trip'
import { MaterialIcons } from '@expo/vector-icons'
import { Fragment, useMemo, useRef, useState } from 'react'
import { Box, Button, Chip, IconButton, Stack, Tab, Tabs, Typography } from '../../../shared/components/mui'
import { BottomSheet } from '../../../shared/components/bottom-sheet/BottomSheet'
import { ListItem } from '../../../shared/components/ListItem'
import { SortableItem, SortableList } from '../../../shared/components/dnd/SortableList'
import { Map, type MapRef } from '../../../shared/components/Map'
import { BottomArea } from '../../../shared/components/BottomArea'
import { useCurrentCoordinate } from '../../../shared/hooks/env/useCurrentCoordinate'
import { useOverlay } from '../../../shared/hooks/useOverlay'
import { useQueryParamState } from '../../../shared/hooks/useQueryParamState'
import { palette } from '../../../shared/config/tokens'
import { useRouteLegsPath } from './components/RoutePath'
import { TripRouteSelector } from './components/TripRouteSelector'
import { TripRouteMapFloatingControls } from './components/TripRouteMapFloatingControls'
import { PlaceSelectSheet } from './PlaceSelectSheet'
import { NoteEditor } from './RouteNoteList'
import { TripRoutePlaceListItem } from './components/TripRoutePlaceListItem'
import { Dot, RouteLegItem } from './RouteTimeline'
import { useRouteLegs } from './useRouteLegs'
import { usePlaceFormOverlay } from './usePlaceFormOverlay'
import { FloatingControl } from './components/FloatingControl'
import { TripDetailHeader } from '../components/TripDetailHeader'

// 경로별 색상 팔레트 — 웹과 같은 값이다.
const ROUTE_COLORS = ['#1976d2', '#e53935', '#43a047', '#fb8c00', '#8e24aa', '#00acc1']

function getRouteColor(index: number): string {
  return ROUTE_COLORS[index % ROUTE_COLORS.length]!
}

const BOTTOM_SHEET_RATIOS = [0.25, 0.5, 0.8, 1] as const
const DEFAULT_BOTTOM_SHEET_RATIO = 0.5 satisfies (typeof BOTTOM_SHEET_RATIOS)[number]

interface RouteContentProps {
  tripId: string
}

export default function TripRoutesContent({ tripId }: RouteContentProps) {
  const { data: trip } = useTrip(tripId)
  const { data: allPlaces, update: updatePlace } = useTripPlaces(tripId)

  const [selectedDate, setSelectedDate] = useQueryParamState<string>('days', {
    defaultValue: () => {
      const today = new Date().toISOString().split('T')[0]!
      if (today >= trip.startDate && today <= trip.endDate) {
        return formatDisplayDate(today)
      }
      return formatDisplayDate(trip.startDate)
    },
  })

  const {
    data: { routes, tripDates },
    create: createRoute,
    remove: removeRoute,
    update,
    toggleVisible,
    updateNotes,
  } = useDayTripRoutes({ tripId, date: selectedDate })

  const [selectedRouteId, setSelectedRouteId] = useQueryParamState<string>('route-id', {
    defaultValue: () => routes[0]?.id ?? '',
  })

  const currentRoute = useMemo(
    () => routes.find((route) => route.id === selectedRouteId) ?? routes[0],
    [routes, selectedRouteId],
  )

  // 숨긴 장소는 경로 계산에서 뺀다.
  const visiblePlaces = useMemo(
    () => currentRoute?.places.filter((x) => !currentRoute.hiddenPlaces.includes(x.id)) ?? [],
    [currentRoute],
  )
  const legByArrivalPlaceId = useRouteLegs(visiblePlaces)
  const currentLegs = useRouteLegsPath(visiblePlaces)

  const currentPlaces = currentRoute?.places ?? []

  const mapRef = useRef<MapRef>(null)
  const overlay = useOverlay()
  const { openBottomsheet: openPlaceEditor } = usePlaceFormOverlay()
  const [selectedPlace, setSelectedPlace] = useState<(typeof allPlaces)[number] | null>(null)

  // 여행 중이면 현재 위치로 이동하고 가장 가까운 장소를 잡아준다.
  const today = formatDisplayDate(new Date())
  const isOngoingTrip = trip.startDate <= today && today <= trip.endDate
  const isInitialedRef = useRef(false)

  const currentCoordinate = useCurrentCoordinate({
    enabled: isOngoingTrip,
    onChange: (coordinate) => {
      if (isInitialedRef.current) return
      isInitialedRef.current = true

      mapRef.current?.panTo(coordinate.lat, coordinate.lng)

      if (selectedDate === today) {
        const nearestPlace = findNearestPlace(coordinate, currentRoute?.places ?? [])
        if (nearestPlace != null) setFocusedId(nearestPlace.id)
      }
    },
  })
  const [focusedId, setFocusedId] = useState<string | null>(null)

  return (
    <>
      <TripDetailHeader />
      <Box sx={{ flex: 1, position: 'relative' }}>
        <TripRouteMapFloatingControls />
        {currentCoordinate != null && (
          <FloatingControl corner="bottom-right" zIndex={8}>
            <IconButton
              size="small"
              onClick={() => mapRef.current?.panTo(currentCoordinate.lat, currentCoordinate.lng)}
              sx={{ backgroundColor: 'rgba(255, 255, 255, 0.8)' }}
            >
              <MaterialIcons name="my-location" size={20} color={palette.primary} />
            </IconButton>
          </FloatingControl>
        )}
        {/* 지도는 항상 전체를 채운다. 시트가 그 위를 덮는다 —
          높이를 시트 비율에 묶으면 상태가 바뀔 때마다 시트가 다시 자리를 잡는다. */}
        <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
          <Map ref={mapRef} defaultCenter={{ lat: trip.lat, lng: trip.lng }}>
            {[
              ...currentLegs.map((leg, index) => (
                <Map.Path
                  key={`leg_${index}`}
                  coordinates={leg.coordinates}
                  strokeColor={getRouteColor(0)}
                  strokeWeight={5}
                />
              )),
              ...allPlaces.map((place) => {
                const isInCurrentRoute = currentRoute?.placeIds.includes(place.id) ?? false
                const orderInRoute = currentRoute?.placeIds.indexOf(place.id) ?? -1

                return (
                  <Map.Marker
                    key={place.id}
                    lat={place.lat}
                    lng={place.lng}
                    label={isInCurrentRoute ? `${orderInRoute + 1}. ${place.name}` : place.name}
                    color={isInCurrentRoute ? (place.id === focusedId ? 'selected' : 'default') : 'disabled'}
                    onClick={() => {
                      if (isInCurrentRoute) {
                        setFocusedId(place.id)
                        mapRef.current?.panTo(place.lat, place.lng)
                      }
                      setSelectedPlace(place)
                    }}
                  />
                )
              }),
            ]}
          </Map>
        </Box>

        <BottomSheet
          snapPoints={BOTTOM_SHEET_RATIOS}
          defaultSnapIndex={BOTTOM_SHEET_RATIOS.indexOf(DEFAULT_BOTTOM_SHEET_RATIO)}
        >
          <BottomSheet.Body sx={{ paddingBottom: 40 }}>
            {/* 여행 일자 선택 */}
            <Tabs
              value={selectedDate}
              onChange={(_, date) => {
                setSelectedDate(date)
                setSelectedRouteId('')
              }}

            >
              {tripDates.map((date, index) => (
                <Tab key={date} value={date} label={`${index + 1}일차`} />
              ))}
            </Tabs>
            <Box sx={{ paddingHorizontal: 16, marginTop: 8 }}>

              {/* 경로 선택 */}
              <TripRouteSelector.Chip
                tripId={tripId}
                date={selectedDate}
                value={currentRoute?.id}
                onChange={(id) => setSelectedRouteId(id ?? '')}
                onDelete={(id) => removeRoute(id)}
                onAdd={() =>
                  createRoute({
                    tripId,
                    name: `${formatShortDate(selectedDate)} 경로 ${routes.length + 1}`,
                    scheduledDate: selectedDate,
                  })
                }
              />

              {currentRoute == null || currentRoute.places.length === 0 ? (
                <Typography variant="caption" color="text.secondary" sx={{ paddingVertical: 24 }}>
                  지도에서 장소를 눌러 경로에 추가하세요
                </Typography>
              ) : (
                <SortableList
                  items={currentPlaces}
                  onSort={(changed) => {
                    update({
                      routeId: currentRoute.id,
                      placeIds: changed.items.map((x) => x.id),
                    })
                  }}
                  renderItem={(place, idx) => {
                    const inboundLeg = legByArrivalPlaceId.get(place.id)
                    const isHidden = currentRoute.hiddenPlaces.includes(place.id)

                    return (
                      <Fragment key={place.id}>

                        <SortableList.Item id={place.id}>
                          {inboundLeg != null && inboundLeg.duration > 0 && (
                            <RouteLegItem leg={inboundLeg} />
                          )}
                          <TripRoutePlaceListItem
                            data={place}
                            focused={focusedId === place.id}
                            onClick={() => {
                              setFocusedId(place.id)
                              mapRef.current?.panTo(place.lat, place.lng)
                            }}
                            leftAddon={(
                              <SortableItem.Handle id={place.id}>
                                <MaterialIcons name="drag-indicator" size={24} color="#787c7e" />
                              </SortableItem.Handle>
                            )}
                            title={
                              <Stack direction="row" alignItems="center" gap={0.5}>
                                <Dot>
                                  <Typography sx={{ color: '#fff', fontSize: 11, fontWeight: '900' }}>
                                    {idx + 1}
                                  </Typography>
                                </Dot>
                                <ListItem.Title>{place.name}</ListItem.Title>
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    toggleVisible({ routeId: currentRoute.id, placeId: place.id })
                                  }
                                >
                                  <MaterialIcons
                                    name={isHidden ? 'visibility-off' : 'visibility'}
                                    size={18}
                                    color={isHidden ? '#bbb' : '#787c7e'}
                                  />
                                </IconButton>
                              </Stack>
                            }
                            rightAddon={
                              <TripRoutePlaceListItem.Actions
                                tripId={tripId}
                                date={selectedDate}
                                routeId={currentRoute.id}
                                placeId={place.id}
                              />
                            }
                          >
                            <NoteEditor
                              notes={place.routeNotes ?? []}
                              onChange={(memos) =>
                                updateNotes({ placeId: place.id, routeId: currentRoute.id, memos })
                              }
                              action="dialog"
                            />
                          </TripRoutePlaceListItem>
                        </SortableList.Item>
                      </Fragment>
                    )
                  }}
                />
              )}
            </Box>
          </BottomSheet.Body>
        </BottomSheet>

        {selectedPlace != null && (
          <BottomSheet
            isOpen
            onClose={() => setSelectedPlace(null)}
            snapPoints={[0.35]}
            defaultSnapIndex={0}
          >
            <BottomSheet.Header>{selectedPlace.name}</BottomSheet.Header>
            <BottomSheet.Body>
              <Stack gap={1}>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={async () => {
                    const updated = await openPlaceEditor({
                      tripId,
                      placeId: selectedPlace.id,
                      defaultValues: selectedPlace,
                    })
                    if (updated) await updatePlace({ ...selectedPlace, ...updated })
                    setSelectedPlace(null)
                  }}
                >
                  장소 수정
                </Button>
                {currentRoute != null && (
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={async () => {
                      const placeIds = currentRoute.placeIds.includes(selectedPlace.id)
                        ? currentRoute.placeIds.filter((id) => id !== selectedPlace.id)
                        : [...currentRoute.placeIds, selectedPlace.id]
                      await update({ routeId: currentRoute.id, placeIds })
                      setSelectedPlace(null)
                    }}
                  >
                    {currentRoute.placeIds.includes(selectedPlace.id) ? '경로에서 제거' : '경로에 추가'}
                  </Button>
                )}
              </Stack>
            </BottomSheet.Body>
          </BottomSheet>
        )}

      </Box>
      <BottomArea position="static">
        <Button
          size="large"
          variant="contained"
          fullWidth
          onClick={() => {
            overlay.open(({ isOpen, close }) => (
              <PlaceSelectSheet
                isOpen={isOpen}
                onClose={close}
                tripId={tripId}
                selectedPlaceIds={currentRoute?.placeIds ?? []}
                onConfirm={(placeIds) => {
                  if (currentRoute == null || placeIds.length === 0) return
                  const merged = Array.from(new Set([...currentRoute.placeIds, ...placeIds]))
                  update({ routeId: currentRoute.id, placeIds: merged })
                }}
              />
            ))
          }}
        >
          장소 추가
        </Button>
      </BottomArea>
    </>
  )
}
