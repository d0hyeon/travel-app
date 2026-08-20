import { formatDisplayDate, formatShortDate } from '@waylog/domains/utils'
import { useDayTripRoutes, useTrip } from '@waylog/domains/trip'
import { useMemo, useRef, useState } from 'react'
import { Box, Chip, Stack, Typography } from '../../../shared/components/mui'
import { BottomSheet } from '../../../shared/components/bottom-sheet/BottomSheet'
import { ListItem } from '../../../shared/components/ListItem'
import { Map, type MapRef } from '../../../shared/components/Map'
import { useQueryParamState } from '../../../shared/hooks/useQueryParamState'
import { palette } from '../../../shared/config/tokens'
import { RoutePath } from './components/RoutePath'
import { TripRouteSelector } from './components/TripRouteSelector'
import { RouteLegItem } from './RouteTimeline'
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

  const mapRef = useRef<MapRef>(null)
  const [sheetRatio, setSheetRatio] = useState<number>(DEFAULT_BOTTOM_SHEET_RATIO)
  const [focusedId, setFocusedId] = useState<string | null>(null)

  return (
    <Box sx={{ flex: 1, position: 'relative' }}>
      <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: `${sheetRatio * 100}%` }}>
        <Map type={trip.isOverseas ? 'google' : 'kakao'} ref={mapRef} defaultCenter={{ lat: trip.lat, lng: trip.lng }}>
          <>
            {routes.map((route, index) => (
              <RoutePath
                key={route.id}
                waypoints={route.places.filter((x) => !route.hiddenPlaces.includes(x.id))}
                color={getRouteColor(index)}
                isSelected={route.id === currentRoute?.id}
              />
            ))}
            {visiblePlaces.map((place, index) => (
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
            ))}
          </>
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

          {visiblePlaces.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ paddingVertical: 24 }}>
              등록된 장소가 없어요
            </Typography>
          ) : (
            <Stack gap={0.5}>
              {visiblePlaces.map((place, index) => {
                const leg = legByArrivalPlaceId.get(place.id)

                return (
                  <Box key={place.id}>
                    {leg != null && <RouteLegItem leg={leg} />}
                    <ListItem.Button
                      focused={place.id === focusedId}
                      onClick={() => {
                        setFocusedId(place.id)
                        mapRef.current?.panTo(place.lat, place.lng)
                      }}
                      leftAddon={<ListItem.Ordering>{index + 1}</ListItem.Ordering>}
                    >
                      <ListItem.Title>{place.name}</ListItem.Title>
                      {place.address !== '' && <ListItem.Text>{place.address}</ListItem.Text>}
                    </ListItem.Button>
                  </Box>
                )
              })}
            </Stack>
          )}
        </BottomSheet.Body>
      </BottomSheet>
    </Box>
  )
}
