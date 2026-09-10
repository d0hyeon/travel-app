import type { TripPlace } from '@waylog/domains/modules/place'
import { useTrip, useTripPlaces } from '@waylog/domains/modules/trip'
import { useCallback } from 'react'
import { usePlaceSearchBottomSheet } from '../../place/place-search/usePlaceSearchBottomSheet'

export function useTripPlaceAddition(tripId: string) {
  const { data: trip } = useTrip(tripId)
  const { create } = useTripPlaces(tripId)

  const { searchPlace } = usePlaceSearchBottomSheet({
    service: trip.isOverseas ? 'google' : 'kakao',
    center: { lat: trip.lat, lng: trip.lng },
  })

  const addPlace = useCallback(async (): Promise<TripPlace | null> => {
    const place = await searchPlace()
    if (place == null) return null

    return create(place)
  }, [searchPlace, create])

  return { addPlace }
}
