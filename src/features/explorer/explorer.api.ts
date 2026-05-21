import { supabase } from '~api/client'
import { PlaceCategoryType, type PlaceCategoryType as PlaceCategoryTypeValue } from '~features/place/place.types'

export const explorerKey = 'explorer'

export const EXPLORER_CATEGORY_TYPES = Object.values(PlaceCategoryType).filter(
  (c) => c !== PlaceCategoryType.대중교통,
)

export interface ExploredPlace {
  placeId: string
  name: string
  address: string
  lat: number
  lng: number
  visitorCount: number
  destinations: string[]
  categories: PlaceCategoryTypeValue[]
  thumbnailUrl?: string
}

export interface ExploredPlacesResult {
  places: ExploredPlace[]
  totalTrips: number
}

async function aggregatePlaces(tripIds?: string[]): Promise<ExploredPlacesResult> {
  let routesQuery = supabase.from('routes').select('trip_id, place_ids')
  if (tripIds) routesQuery = routesQuery.in('trip_id', tripIds)

  const { data: routes, error: routesError } = await routesQuery
  if (routesError) throw routesError

  const tripPlaceIds = [...new Set((routes ?? []).flatMap((r) => r.place_ids ?? []))]
  if (tripPlaceIds.length === 0) return { places: [], totalTrips: 0 }

  const allTripIds = [...new Set((routes ?? []).map((r) => r.trip_id))]

  const [tripPlacesResult, tripsResult] = await Promise.all([
    supabase.from('trip_places').select('id, place_id, category').in('id', tripPlaceIds),
    supabase.from('trips').select('id, destinations').in('id', allTripIds),
  ])

  if (tripPlacesResult.error) throw tripPlacesResult.error
  if (tripsResult.error) throw tripsResult.error

  const tripPlaceToInfo = new Map(
    (tripPlacesResult.data ?? []).map((r) => [r.id, { placeId: r.place_id, category: r.category as PlaceCategoryTypeValue | null }])
  )
  const tripDestinations = new Map(
    (tripsResult.data ?? []).map((t) => [t.id, (t as never as { destinations: string[] }).destinations ?? []])
  )

  const tripPlacesMap = new Map<string, Set<string>>()
  const placeTripsMap = new Map<string, Set<string>>()
  const placeCategoriesMap = new Map<string, Set<PlaceCategoryTypeValue>>()

  for (const route of routes ?? []) {
    if (!tripPlacesMap.has(route.trip_id)) {
      tripPlacesMap.set(route.trip_id, new Set())
    }
    const placeSet = tripPlacesMap.get(route.trip_id)!
    for (const tripPlaceId of route.place_ids ?? []) {
      const info = tripPlaceToInfo.get(tripPlaceId)
      if (!info) continue
      const { placeId, category } = info

      // 대중교통 제외
      if (category === PlaceCategoryType.대중교통) continue

      placeSet.add(placeId)
      if (!placeTripsMap.has(placeId)) placeTripsMap.set(placeId, new Set())
      placeTripsMap.get(placeId)!.add(route.trip_id)

      if (category) {
        if (!placeCategoriesMap.has(placeId)) placeCategoriesMap.set(placeId, new Set())
        placeCategoriesMap.get(placeId)!.add(category)
      }
    }
  }

  const totalTrips = tripPlacesMap.size

  const visitCountMap: Record<string, number> = {}
  for (const placeSet of tripPlacesMap.values()) {
    for (const placeId of placeSet) {
      visitCountMap[placeId] = (visitCountMap[placeId] ?? 0) + 1
    }
  }

  const placeIds = Object.keys(visitCountMap)
  if (placeIds.length === 0) return { places: [], totalTrips }

  const [placesResult, photosResult, postPhotosResult] = await Promise.all([
    supabase.from('places').select('id, name, address, lat, lng').in('id', placeIds),
    supabase.from('photos').select('place_id, url').in('place_id', placeIds).eq('is_public', true),
    supabase.from('post_photos').select('place_id, url').in('place_id', placeIds).eq('is_public', true),
  ])

  if (placesResult.error) throw placesResult.error
  if (photosResult.error) throw photosResult.error
  if (postPhotosResult.error) throw postPhotosResult.error

  const thumbnailMap = [...(photosResult.data ?? []), ...(postPhotosResult.data ?? [])].reduce<Record<string, string>>(
    (acc, photo) => {
      if (photo.place_id && !acc[photo.place_id]) acc[photo.place_id] = photo.url
      return acc
    },
    {},
  )

  const places = (placesResult.data ?? []).map((place) => {
    const visitedTripIds = placeTripsMap.get(place.id) ?? new Set()
    const destinations = [...new Set(
      [...visitedTripIds].flatMap((tid) => tripDestinations.get(tid) ?? [])
    )]
    const categories = [...(placeCategoriesMap.get(place.id) ?? [])]
    return {
      placeId: place.id,
      name: place.name,
      address: place.address ?? '',
      lat: place.lat,
      lng: place.lng,
      visitorCount: visitCountMap[place.id] ?? 1,
      destinations,
      categories,
      thumbnailUrl: thumbnailMap[place.id],
    }
  })

  return { places, totalTrips }
}

export async function getExploredPlaces(): Promise<ExploredPlacesResult> {
  return aggregatePlaces()
}

export async function getRecentHotPlaces(months: number): Promise<ExploredPlacesResult> {
  const since = new Date()
  since.setMonth(since.getMonth() - months)
  const sinceISO = since.toISOString().split('T')[0]

  const { data: trips, error: tripsError } = await supabase
    .from('trips')
    .select('id')
    .gte('end_date', sinceISO)

  if (tripsError) throw tripsError

  const tripIds = (trips ?? []).map((t) => t.id)
  if (tripIds.length === 0) return { places: [], totalTrips: 0 }

  return aggregatePlaces(tripIds)
}
