import { supabase } from '@waylog/domains/clients'
import { getTripPlacesByTripId } from '../place'
import type { PlaceCategoryType } from '../place'
import { calcDistance } from '@waylog/utility'


export const recommendedPlaceKey = 'recommended-places'

export interface RecommendedPlace {
  /** 전역 places.id */
  id: string
  tripId: string
  provider: string
  externalId: string
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
  /** 전역 places.id */
  id: string
  tripId: string
  provider: string
  externalId: string
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
  if (a.id === b.id) return true
  if (normalizeName(a.name) === normalizeName(b.name)) return true
  return calcDistance(a, b) < SAME_PLACE_DISTANCE_THRESHOLD
}

function calcRecommendLabel(place: ScoredPlace): string {
  if (place.tripCount >= 3) return '이 지역 인기 장소'
  if (place.tripCount >= 2) return '믾이 방문하는 곳'
  const daysAgo = (Date.now() - new Date(place.latestTripDate).getTime()) / (1000 * 60 * 60 * 24)
  if (daysAgo < 30) return '최근 많이 방문하는 곳'
  return '저장 많은 장소'
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

/**
 * RPC 가 내주는 후보 한 줄. trip_place_id 와 place_id 를 모두 받는다 —
 * 한쪽만 place_id 로 부르면 어느 테이블의 키인지 이름으로 구분되지 않는다.
 */
interface CandidateRow {
  trip_place_id: string
  place_id: string
  trip_id: string
  trip_start_date: string
  category: string | null
  provider: string
  external_id: string
  name: string
  address: string
  lat: number
  lng: number
  photo_urls: string[] | null
  is_confirmed: boolean
  is_hidden: boolean
}

/**
 * 후보 수집은 RPC 가 맡는다. trips 와 trip_places 의 RLS 는 내가 속한 여행만
 * 통과시켜, 남의 여행에서 후보를 모으는 이 기능은 클라이언트 조회로 늘 빈
 * 결과를 받았다. 점수와 중복 병합은 순수 로직이라 이쪽에 남긴다.
 */
export async function getRecommendedPlaces(
  currentTripId: string,
  destinations: string[],
): Promise<RecommendedPlace[]> {
  if (destinations.length === 0) return []

  const [candidatesResult, currentPlaces] = await Promise.all([
    supabase.rpc('get_recommended_place_candidates', {
      p_trip_id: currentTripId,
      p_destinations: destinations,
    }),
    getTripPlacesByTripId(currentTripId),
  ])

  if (candidatesResult.error) throw candidatesResult.error

  const candidates = (candidatesResult.data ?? []) as unknown as CandidateRow[]
  if (candidates.length === 0) return []

  const currentPlaceNames = new Set(currentPlaces.map(p => normalizeName(p.name)))

  const scoredPlaces: ScoredPlace[] = candidates
    .filter(row => !row.is_hidden)
    .filter(row => !currentPlaceNames.has(normalizeName(row.name)))
    .map(row => {
      const photos = row.photo_urls ?? []
      return {
        id: row.place_id,
        tripId: row.trip_id,
        provider: row.provider,
        externalId: row.external_id,
        name: row.name,
        address: row.address,
        lat: row.lat,
        lng: row.lng,
        category: (row.category as PlaceCategoryType) ?? undefined,
        photos,
        confirmedCount: row.is_confirmed ? 1 : 0,
        photoCount: photos.length,
        latestTripDate: row.trip_start_date,
        tripCount: 1,
      }
    })

  return deduplicateAndMerge(scoredPlaces)
    .toSorted((a, b) => calcScore(b) - calcScore(a))
    .slice(0, MAX_RESULTS)
    .map(place => ({
      id: place.id,
      tripId: place.tripId,
      provider: place.provider,
      externalId: place.externalId,
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
