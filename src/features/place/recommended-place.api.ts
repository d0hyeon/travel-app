import { supabase } from '~api/client'
import type { PlaceCategoryType } from './place.types'

export const recommendedPlaceKey = 'recommended-places'

export interface RecommendedPlace {
  id: string
  tripId: string
  name: string
  address: string
  lat: number
  lng: number
  category?: PlaceCategoryType
  photos: string[]
}

export async function getRecommendedPlaces(
  currentTripId: string,
  destinations: string[],
): Promise<RecommendedPlace[]> {
  if (destinations.length === 0) return []

  const { data: trips, error: tripsError } = await supabase
    .from('trips')
    .select('id')
    .in('destination', destinations)
    .neq('id', currentTripId)

  if (tripsError) throw tripsError

  const tripIds = (trips ?? []).map(t => t.id)
  if (tripIds.length === 0) return []

  const { data: places, error: placesError } = await supabase
    .from('places')
    .select('*, photos(url)')
    .in('trip_id', tripIds)

  if (placesError) throw placesError

  return (places ?? []).map(row => ({
    id: row.id,
    tripId: row.trip_id,
    name: row.name,
    address: row.address ?? '',
    lat: row.lat,
    lng: row.lng,
    category: (row.category as PlaceCategoryType) ?? undefined,
    photos: ((row as { photos?: { url: string }[] }).photos ?? []).map(p => p.url),
  }))
}
