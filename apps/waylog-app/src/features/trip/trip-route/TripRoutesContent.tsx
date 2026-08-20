import { useDayTripRoutes, useTrip } from '@waylog/domains/trip'
import { useMemo, useRef, useState } from 'react'
import { ScrollView, View } from 'react-native'
import { Button, Stack, Text } from '../../../shared/components'
import { Map, type MapRef } from '../../../shared/components/Map'
import { palette } from '../../../shared/config/tokens'
import { useQueryParamState } from '../../../shared/hooks/useQueryParamState'
import { useActiveTripDay } from './useActiveTripDay'
import { RouteLegItem } from './RouteTimeline'
import { useRouteLegs } from './useRouteLegs'

interface Props {
  tripId: string
}

export function TripRoutesContent({ tripId }: Props) {
  const { data: trip } = useTrip(tripId)
  const { value: activeDay } = useActiveTripDay(tripId)
  const {
    data: { routes },
  } = useDayTripRoutes({ tripId, date: activeDay })

  const mapRef = useRef<MapRef>(null)
  const [focusedId, setFocusedId] = useState<string | null>(null)

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

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <Map ref={mapRef} defaultCenter={{ lat: trip.lat, lng: trip.lng }}>
          <>
            {visiblePlaces.map((place, index) => (
              <Map.Marker
                key={place.id}
                lat={place.lat}
                lng={place.lng}
                label={`${index + 1}. ${place.name}`}
                color={place.id === focusedId ? 'selected' : 'default'}
                onClick={() => setFocusedId(place.id)}
              />
            ))}
            {visiblePlaces.length > 1 && <Map.Path coordinates={visiblePlaces} />}
          </>
        </Map>
      </View>

      <View style={{ flex: 1, padding: 16, backgroundColor: palette.background }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Stack direction="row" gap={6}>
            {routes.map((route, index) => (
              <Button
                key={route.id}
                size="sm"
                variant={route.id === currentRoute?.id ? 'contained' : 'outlined'}
                onPress={() => setSelectedRouteId(route.id)}
              >
                {`${index + 1}일차`}
              </Button>
            ))}
          </Stack>
        </ScrollView>

        <ScrollView contentContainerStyle={{ paddingTop: 12 }}>
          {visiblePlaces.length === 0 ? (
            <Text variant="body2" color={palette.textSecondary}>
              등록된 장소가 없습니다
            </Text>
          ) : (
            <Stack gap={10}>
              {visiblePlaces.map((place, index) => {
                const leg = legByArrivalPlaceId.get(place.id)

                return (
                  <Stack key={place.id} gap={4}>
                    {leg != null && <RouteLegItem leg={leg} />}
                    <Text variant="body2" bold numberOfLines={1}>
                      {index + 1}. {place.name}
                    </Text>
                  </Stack>
                )
              })}
            </Stack>
          )}
        </ScrollView>
      </View>
    </View>
  )
}
