import { supabase, type DataRaw, type Json } from '@waylog/domains/clients'
import type { Post, PostPhoto, PostPlace } from '@waylog/domains/modules/post'
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
  destinations: string[]
  categories: PlaceCategoryValue[]
  thumbnailUrl?: string
}

export async function getExploredPlaces(sinceDate?: string): Promise<ExploredPlace[]> {
  const { data, error } = await supabase.rpc('get_explored_places', {
    since_date: sinceDate,
  })

  if (error) throw error

  return (data ?? []).map((row) => ({
    placeId: row.place_id,
    name: row.name,
    address: row.address ?? '',
    lat: row.lat,
    lng: row.lng,
    visitorCount: row.visitor_count,
    photoCount: row.photo_count,
    postCount: row.post_count,
    score: row.score,
    destinations: toStringArray(row.destinations),
    categories: toPlaceCategories(row.categories),
    thumbnailUrl: row.thumbnail_url ?? undefined,
  }))
}

export async function getMostSavedPlaces(): Promise<MostSavedPlace[]> {
  const { data, error } = await supabase.rpc('get_most_saved_places')

  if (error) throw error

  return (data ?? []).map((row) => ({
    placeId: row.place_id,
    name: row.name,
    address: row.address ?? '',
    lat: row.lat,
    lng: row.lng,
    saveCount: row.save_count,
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

export const EXPLORER_CATEGORY_TYPES = Object.values(PlaceCategoryType).filter(
  (category) => category !== PlaceCategoryType.대중교통,
)

export async function getPlaceFeed(placeId: string): Promise<Post[]> {
  const { data: locations, error: locationError } = await supabase
    .from('post_locations')
    .select('*')
    .eq('place_id', placeId)

  if (locationError) throw locationError

  const postIds = [...new Set((locations ?? []).map((location) => location.post_id))]
  if (postIds.length === 0) return []

  const [{ data: posts, error: postError }, { data: photos, error: photoError }] = await Promise.all([
    supabase.from('posts').select('*').in('id', postIds).eq('visibility', 'PUBLIC').order('created_at', { ascending: false }),
    supabase.from('post_photos').select('*').in('post_id', postIds),
  ])

  if (postError) throw postError
  if (photoError) throw photoError

  const placeIds = [...new Set((locations ?? []).map((location) => location.place_id))]
  const { data: places, error: placeError } = await supabase.from('places').select('*').in('id', placeIds)
  if (placeError) throw placeError

  const placesById = new Map((places ?? []).map((place) => [place.id, place]))
  const locationsByPostId = groupByPostId(locations ?? [])
  const photosByPostId = groupByPostId(photos ?? [])

  return (posts ?? []).map((post) => toExplorerPost(
    post,
    locationsByPostId.get(post.id) ?? [],
    photosByPostId.get(post.id) ?? [],
    placesById,
  ))
}

function groupByPostId<T extends { post_id: string }>(rows: T[]): Map<string, T[]> {
  return rows.reduce((groupedRows, row) => {
    const rowsForPost = groupedRows.get(row.post_id) ?? []
    rowsForPost.push(row)
    groupedRows.set(row.post_id, rowsForPost)
    return groupedRows
  }, new Map<string, T[]>())
}

function toExplorerPost(
  post: DataRaw<'posts'>,
  locations: DataRaw<'post_locations'>[],
  photos: DataRaw<'post_photos'>[],
  placesById: Map<string, DataRaw<'places'>>,
): Post {
  const postPhotos: PostPhoto[] = photos
    .toSorted((first, second) => first.display_order - second.display_order)
    .map((photo) => ({
      url: photo.url,
      storagePath: photo.storage_path,
      placeId: photo.place_id,
      isPublic: photo.is_public,
    }))

  const postPlaces: PostPlace[] = locations
    .toSorted((first, second) => first.display_order - second.display_order)
    .flatMap((location) => {
      const place = placesById.get(location.place_id)
      if (place == null) return []
      return [{
        placeId: place.id,
        name: place.name,
        lat: place.lat,
        lng: place.lng,
        address: place.address,
      }]
    })

  return {
    id: post.id,
    authorId: post.author_id,
    tripId: post.trip_id,
    title: post.title,
    description: post.description,
    places: postPlaces,
    visibility: post.visibility,
    photos: postPhotos,
    createdAt: post.created_at,
    updatedAt: post.updated_at,
  }
}
