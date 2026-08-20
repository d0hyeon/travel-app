import { findNearestPlace } from '@waylog/domains/trip'
import { formatDisplayDate, formatShortDate } from '@waylog/domains/utils'
import { useDayTripRoutes, useTrip } from '@waylog/domains/trip'
import { MaterialIcons } from '@expo/vector-icons'
import { Fragment, startTransition, useMemo, useOptimistic, useRef, useState } from 'react'
import { Box, Button, Chip, IconButton, Stack, Typography } from '../../../shared/components/mui'
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

  const [currentPlaces, setOptimisticCurrentPlaces] = useOptimistic(currentRoute?.places ?? [])

  const mapRef = useRef<MapRef>(null)
  const overlay = useOverlay()

  // 여행 중이면 현재 위치로 이동하고 가장 가까운 장소를 잡아준다.
  const today = formatDisplayDate(new Date())
  const isOngoingTrip = trip.startDate <= today && today <= trip.endDate
  const isInitialedRef = useRef(false)

  useCurrentCoordinate({
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
  const [sheetRatio, setSheetRatio] = useState<number>(DEFAULT_BOTTOM_SHEET_RATIO)
  const [focusedId, setFocusedId] = useState<string | null>(null)

  return (
    <Box sx={{ flex: 1, position: 'relative' }}>
      <TripRouteMapFloatingControls />
      <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: `${sheetRatio * 100}%` }}>
        <Map type={trip.isOverseas ? 'google' : 'kakao'} ref={mapRef} defaultCenter={{ lat: trip.lat, lng: trip.lng }}>
          {[
            ...currentLegs.map((leg, index) => (
              <Map.Path
                key={`leg_${index}`}
                coordinates={leg.coordinates}
                strokeColor={getRouteColor(0)}
                strokeWeight={5}
              />
            )),
            ...visiblePlaces.map((place, index) => (
              <Map.Marker
                key={place.id}
                lat={place.lat}
                lng={place.lng}
                label={`${index + 1}. ${place.name}`}
                color={place.id === focusedId ? 'selected' : 'default'}
                onClick={() => {
                  setFocusedId(place.id)
                  mapRef.current?.panTo(place.lat, place.lng)
                }}
              />
            )),
          ]}
        </Map>
      </Box>

      <BottomSheet
        snapPoints={BOTTOM_SHEET_RATIOS}
        defaultSnapIndex={BOTTOM_SHEET_RATIOS.indexOf(DEFAULT_BOTTOM_SHEET_RATIO)}
        onSnapChange={(ratio) => {
          if (ratio < 1 && ratio !== sheetRatio) setSheetRatio(ratio)
        }}
      >
        <BottomSheet.Body sx={{ paddingHorizontal: 16, paddingBottom: 40 }}>
          {/* 여행 일자 선택 */}
          <Stack direction="row" gap={0.5} sx={{ flexWrap: 'wrap', marginBottom: 12 }}>
            {tripDates.map((date, index) => (
              <Chip
                key={date}
                label={`${index + 1}일차`}
                size="small"
                variant={date === selectedDate ? 'filled' : 'outlined'}
                color={date === selectedDate ? 'primary' : 'default'}
                onClick={() => setSelectedDate(date)}
              />
            ))}
          </Stack>

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
                startTransition(async () => {
                  setOptimisticCurrentPlaces(changed.items)
                  await update({
                    routeId: currentRoute.id,
                    placeIds: changed.items.map((x) => x.id),
                  })
                })
              }}
              renderItem={(place, idx) => {
                const inboundLeg = legByArrivalPlaceId.get(place.id)
                const isHidden = currentRoute.hiddenPlaces.includes(place.id)

                return (
                  <Fragment key={place.id}>
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
                      leftAddon={<SortableItem.Handle id={place.id} />}
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
                  </Fragment>
                )
              }}
            />
          )}
        </BottomSheet.Body>
      </BottomSheet>

      <BottomArea sx={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 20 }}>
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
    </Box>
  )
}
