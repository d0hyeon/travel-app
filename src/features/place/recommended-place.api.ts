import { supabase } from '~api/client'
import { calcDistance } from '~shared/utils/geo'
import { getPlacesByTripId } from './place.api'
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
  tripCount: number
  recommendLabel: string
}

const SAME_PLACE_DISTANCE_THRESHOLD = 100 // meters
const MAX_RESULTS = 20
const MAX_PHOTO_SCORE = 45

function normalizeName(name: string) {
  return name.trim().toLowerCase()
}

function calcRecencyScore(tripStartDate: string): number {
  const daysAgo = (Date.now() - new Date(tripStartDate).getTime()) / (1000 * 60 * 60 * 24)
  if (daysAgo < 30) return 20
  if (daysAgo < 90) return 15
  if (daysAgo < 365) return 10
  return 5
}

interface ScoredPlace {
  id: string
  tripId: string
  name: string
  address: string
  lat: number
  lng: number
  category?: PlaceCategoryType
  photos: string[]
  confirmedCount: number
  photoCount: number
  latestTripDate: string
  tripCount: number
}

function isSamePlace(a: ScoredPlace, b: ScoredPlace): boolean {
  if (normalizeName(a.name) === normalizeName(b.name)) return true
  return calcDistance(a, b) < SAME_PLACE_DISTANCE_THRESHOLD
}

function calcRecommendLabel(place: ScoredPlace): string {
  if (place.tripCount >= 3) return '이 지역 인기 장소'
  if (place.tripCount >= 2) return '여러 여행자가 방문한 곳'
  const daysAgo = (Date.now() - new Date(place.latestTripDate).getTime()) / (1000 * 60 * 60 * 24)
  if (daysAgo < 30) return '최근 많이 방문하는 곳'
  return '여행자들이 저장한 장소'
}

function calcScore(place: ScoredPlace): number {
  return (
    place.confirmedCount * 50 +
    Math.min(place.photoCount * 15, MAX_PHOTO_SCORE) +
    calcRecencyScore(place.latestTripDate)
  )
}

function deduplicateAndMerge(places: ScoredPlace[]): ScoredPlace[] {
  const groups: ScoredPlace[][] = []

  for (const place of places) {
    const existingGroup = groups.find(group => group.some(p => isSamePlace(p, place)))
    if (existingGroup) {
      existingGroup.push(place)
    } else {
      groups.push([place])
    }
  }

  return groups.map(group => {
    const representative = group.reduce((best, p) => calcScore(p) >= calcScore(best) ? p : best)
    const mergedPhotoCount = group.reduce((sum, p) => sum + p.photoCount, 0)
    const mergedPhotos = representative.photos.length > 0
      ? representative.photos
      : group.flatMap(p => p.photos).slice(0, 3)
    const latestTripDate = group.reduce(
      (latest, p) => p.latestTripDate > latest ? p.latestTripDate : latest,
      group[0].latestTripDate,
    )

    return {
      ...representative,
      confirmedCount: group.reduce((sum, p) => sum + p.confirmedCount, 0),
      photoCount: mergedPhotoCount,
      latestTripDate,
      photos: mergedPhotos,
      tripCount: new Set(group.map(p => p.tripId)).size,
    }
  })
}

export async function getRecommendedPlaces(
  currentTripId: string,
  destinations: string[],
): Promise<RecommendedPlace[]> {
  if (destinations.length === 0) return []

  const [tripsResult, currentPlaces] = await Promise.all([
    supabase
      .from('trips')
      .select('id, start_date')
      .in('destination', destinations)
      .neq('id', currentTripId),
    getPlacesByTripId(currentTripId),
  ])

  if (tripsResult.error) throw tripsResult.error

  const otherTrips = tripsResult.data ?? []
  if (otherTrips.length === 0) return []

  const tripIds = otherTrips.map(t => t.id)
  const tripDateMap = new Map(otherTrips.map(t => [t.id, t.start_date]))

  const [placesResult, routesResult] = await Promise.all([
    supabase.from('places').select('*, photos(url, is_public)').in('trip_id', tripIds),
    supabase.from('routes').select('trip_id, place_ids, hidden_places').in('trip_id', tripIds),
  ])

  if (placesResult.error) throw placesResult.error
  if (routesResult.error) throw routesResult.error

  const routes = routesResult.data ?? []
  const confirmedPlaceIds = new Set(routes.flatMap(r => r.place_ids ?? []))
  const hiddenPlaceIds = new Set(routes.flatMap(r => r.hidden_places ?? []))
  const currentPlaceNames = new Set(currentPlaces.map(p => normalizeName(p.name)))

  const scoredPlaces: ScoredPlace[] = (placesResult.data ?? [])
    .filter(row => !hiddenPlaceIds.has(row.id))
    .filter(row => !currentPlaceNames.has(normalizeName(row.name)))
    .map(row => {
      const photos = ((row as { photos?: { url: string; is_public: boolean }[] }).photos ?? [])
        .filter(photo => photo.is_public)
        .map(photo => photo.url)
      return {
        id: row.id,
        tripId: row.trip_id,
        name: row.name,
        address: row.address ?? '',
        lat: row.lat,
        lng: row.lng,
        category: (row.category as PlaceCategoryType) ?? undefined,
        photos,
        confirmedCount: confirmedPlaceIds.has(row.id) ? 1 : 0,
        photoCount: photos.length,
        latestTripDate: tripDateMap.get(row.trip_id) ?? '',
        tripCount: 1,
      }
    })

  return deduplicateAndMerge(scoredPlaces)
    .toSorted((a, b) => calcScore(b) - calcScore(a))
    .slice(0, MAX_RESULTS)
    .map(place => ({
      id: place.id,
      tripId: place.tripId,
      name: place.name,
      address: place.address,
      lat: place.lat,
      lng: place.lng,
      category: place.category,
      photos: place.photos,
      tripCount: place.tripCount,
      recommendLabel: calcRecommendLabel(place),
    }))
}
