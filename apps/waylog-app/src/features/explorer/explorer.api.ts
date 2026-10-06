import { supabase, type Json } from '@waylog/domains/clients'
import {
  PlaceCategoryType,
  PlaceCategoryTypes,
  type PlaceCategoryType as PlaceCategoryValue,
} from '@waylog/domains/modules/place'

export const explorerKey = 'explorer'

export interface ExploredPlace {
  placeId: string
  name: string
  address: string
  lat: number
  lng: number
  visitorCount: number
  lastSavedAt?: string
  photoCount: number
  postCount: number
  score: number
  destinations: string[]
  categories: PlaceCategoryValue[]
  thumbnailUrl?: string
}

export interface MostSavedPlace {
  placeId: string
  name: string
  address: string
  lat: number
  lng: number
  saveCount: number
  lastSavedAt?: string
  destinations: string[]
  categories: PlaceCategoryValue[]
  thumbnailUrl?: string
}

export interface ExplorerPlaceFilters {
  location?: string
  category?: PlaceCategoryValue
}

export async function getExploredPlaces(
  { location, category }: ExplorerPlaceFilters,
  sinceDate?: string,
): Promise<ExploredPlace[]> {
  const { data, error } = await supabase.rpc('get_explored_places', {
    since_date: sinceDate,
    location,
    category,
  })

  if (error) throw error

  return (data ?? []).map((row) => ({
    placeId: row.place_id,
    name: row.name,
    address: row.address ?? '',
    lat: row.lat,
    lng: row.lng,
    visitorCount: row.visitor_count,
    lastSavedAt: row.last_saved_at ?? undefined,
    photoCount: row.photo_count,
    postCount: row.post_count,
    score: row.score,
    destinations: toStringArray(row.destinations),
    categories: toPlaceCategories(row.categories),
    thumbnailUrl: row.thumbnail_url ?? undefined,
  }))
}

export async function getMostSavedPlaces({ location, category }: ExplorerPlaceFilters): Promise<MostSavedPlace[]> {
  const { data, error } = await supabase.rpc('get_most_saved_places', {
    location,
    category,
  })

  if (error) throw error

  return (data ?? []).map((row) => ({
    placeId: row.place_id,
    name: row.name,
    address: row.address ?? '',
    lat: row.lat,
    lng: row.lng,
    saveCount: row.save_count,
    lastSavedAt: row.last_saved_at ?? undefined,
    destinations: toStringArray(row.destinations),
    categories: toPlaceCategories(row.categories),
    thumbnailUrl: row.thumbnail_url ?? undefined,
  }))
}

function toStringArray(value: Json): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string')
}

function toPlaceCategories(value: Json): PlaceCategoryValue[] {
  if (!Array.isArray(value)) return []
  return value.filter(isPlaceCategory)
}

function isPlaceCategory(value: Json): value is PlaceCategoryValue {
  return typeof value === 'string' && PlaceCategoryTypes.some((category) => category === value)
}

const NON_EXPLORABLE_CATEGORIES: readonly PlaceCategoryValue[] = [
  PlaceCategoryType.대중교통,
  PlaceCategoryType.기타,
]

export const EXPLORER_CATEGORY_TYPES = Object.values(PlaceCategoryType).filter(
  (category) => !NON_EXPLORABLE_CATEGORIES.includes(category),
)
