import { PlaceCategoryColorCode, type TripPlace } from '@waylog/domains/place'
import { useTrip, useTripPlaces, useTripRoutes } from '@waylog/domains/trip'
import { arraySplit } from '@waylog/domains/utils'
import { useRouter } from 'expo-router'
import { useMemo, useRef, useState } from 'react'
import { ScrollView, View } from 'react-native'
import { Map, type MapRef } from '../../../shared/components/Map'
import { Button, Stack, Text } from '../../../shared/components'
import { palette } from '../../../shared/config/tokens'
import { usePlaceDetailOverlay } from '../../place/place-detail/usePlaceDetailOverlay'
import { TripPlaceItemButton } from './TripPlaceItemButton'

// 이 배율보다 멀어지면 라벨을 숨기고 점으로만 표시한다. 웹과 같은 기준이다.
const MICRO_ZOOM_LEVEL = 12

interface Props {
  tripId: string
}

export function TripPlaceContent({ tripId }: Props) {
  const { data: trip } = useTrip(tripId)
  const { data: places } = useTripPlaces(tripId)
  const {
    data: { routes },
  } = useTripRoutes(tripId)

  const mapRef = useRef<MapRef>(null)
  const [focusedId, setFocusedId] = useState<string | null>(null)
  const placeDetail = usePlaceDetailOverlay()
  const router = useRouter()

  const plannedPlaceIds = useMemo(
    () => new Set(routes.flatMap((route) => route.placeIds)),
    [routes],
  )
  const [plannedPlaces, candidatePlaces] = useMemo(
    () => arraySplit(places, (place) => plannedPlaceIds.has(place.id)),
    [places, plannedPlaceIds],
  )

  const focusPlace = (place: TripPlace) => {
    setFocusedId(place.id)
    mapRef.current?.panTo(place.lat, place.lng)
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <Map ref={mapRef} defaultCenter={{ lat: trip.lat, lng: trip.lng }}>
          {({ zoom }) =>
            places.map((place) => (
              <Map.Marker
                key={place.id}
                lat={place.lat}
                lng={place.lng}
                label={zoom > MICRO_ZOOM_LEVEL ? undefined : place.name}
                variant={zoom > MICRO_ZOOM_LEVEL ? 'circle' : 'pin'}
                color={
                  place.category != null
                    ? PlaceCategoryColorCode[place.category]
                    : plannedPlaceIds.has(place.id)
                      ? 'selected'
                      : 'default'
                }
                onClick={() => {
                  setFocusedId(place.id)
                  placeDetail.open(place.placeId)
                }}
              />
            ))
          }
        </Map>
      </View>

      <View style={{ flex: 1, padding: 16, backgroundColor: palette.background }}>
        <Stack direction="row" align="center" justify="space-between">
          <Text variant="caption" color={palette.textSecondary}>
            확정 ({plannedPlaces.length}) / 후보 ({candidatePlaces.length})
          </Text>
          <Button size="sm" onPress={() => router.push(`/trip/${tripId}/place-search`)}>
            장소 추가
          </Button>
        </Stack>

        <ScrollView contentContainerStyle={{ paddingTop: 8 }}>
          <Stack gap={6}>
            {[...plannedPlaces, ...candidatePlaces].map((place) => (
              <TripPlaceItemButton
                key={place.id}
                place={place}
                focused={place.id === focusedId}
                planned={plannedPlaceIds.has(place.id)}
                onPress={() => focusPlace(place)}
              />
            ))}
          </Stack>
        </ScrollView>
      </View>
    </View>
  )
}
