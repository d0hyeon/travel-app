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

interface ExploredPlaceRow {
  place_id: string
  name: string
  address: string
  lat: number
  lng: number
  visitor_count: number
  destinations: string[]
  categories: PlaceCategoryTypeValue[]
  thumbnail_url: string | null
  total_trips: number
}

async function callExploredPlaces(sinceDate?: string): Promise<ExploredPlacesResult> {
  const { data, error } = await supabase.rpc('get_explored_places' as 'get_user_trips', {
    since_date: sinceDate ?? null,
  } as never)

  if (error) throw error

  const rows = (data as unknown as ExploredPlaceRow[]) ?? []
  const totalTrips = rows[0]?.total_trips ?? 0

  const places = rows.map((row) => ({
    placeId: row.place_id,
    name: row.name,
    address: row.address ?? '',
    lat: row.lat,
    lng: row.lng,
    visitorCount: row.visitor_count,
    destinations: row.destinations ?? [],
    categories: row.categories ?? [],
    thumbnailUrl: row.thumbnail_url ?? undefined,
  }))

  return { places, totalTrips }
}

export async function getExploredPlaces(): Promise<ExploredPlacesResult> {
  return callExploredPlaces()
}

export async function getRecentHotPlaces(months: number): Promise<ExploredPlacesResult> {
  const since = new Date()
  since.setMonth(since.getMonth() - months)
  const sinceISO = since.toISOString().split('T')[0]

  return callExploredPlaces(sinceISO)
}
