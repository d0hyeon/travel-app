import { getAuth } from '../../gateways/auth'
import { supabase, type DataRaw } from '../../gateways/client'
import { assert } from '@waylog/utility'
import type { Post, PostPhoto, PostPlace, PostVisibility } from './post.types'

export const postKey = 'posts'
export const postLikeKey = 'post-likes'

type PostRow = DataRaw<'posts'>
type PostPhotoRow = DataRaw<'post_photos'>
type PostLocationRow = DataRaw<'post_locations'>
type PlaceRow = DataRaw<'places'>

interface PostRelations {
  photos: PostPhotoRow[]
  locations: PostLocationRow[]
  placesById: Map<string, PlaceRow>
}

function toPost(post: PostRow, relations: PostRelations): Post {
  const photos: PostPhoto[] = relations.photos
    .toSorted((firstPhoto, secondPhoto) => firstPhoto.display_order - secondPhoto.display_order)
    .map((photo) => ({
      url: photo.url,
      storagePath: photo.storage_path,
      placeId: photo.place_id,
      isPublic: photo.is_public,
    }))

  const places: PostPlace[] = relations.locations
    .toSorted((firstLocation, secondLocation) => firstLocation.display_order - secondLocation.display_order)
    .flatMap((location) => {
      const place = relations.placesById.get(location.place_id)
      if (!place) return []
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
    places,
    visibility: post.visibility,
    photos,
    createdAt: post.created_at,
    updatedAt: post.updated_at,
  }
}

async function getRelations(postIds: string[]): Promise<Map<string, PostRelations>> {
  if (postIds.length === 0) return new Map()

  const [{ data: photos, error: photoError }, { data: locations, error: locationError }] = await Promise.all([
    supabase.from('post_photos').select('*').in('post_id', postIds),
    supabase.from('post_locations').select('*').in('post_id', postIds),
  ])
  if (photoError) throw photoError
  if (locationError) throw locationError

  const placeIds = [...new Set((locations ?? []).map((location) => location.place_id))]
  const { data: places, error: placeError } = placeIds.length === 0
    ? { data: [], error: null }
    : await supabase.from('places').select('*').in('id', placeIds)
  if (placeError) throw placeError

  const placesById = new Map((places ?? []).map((place) => [place.id, place]))
  const photosByPostId = new Map<string, PostPhotoRow[]>()
  const locationsByPostId = new Map<string, PostLocationRow[]>()

  for (const photo of photos ?? []) {
    const postPhotos = photosByPostId.get(photo.post_id) ?? []
    postPhotos.push(photo)
    photosByPostId.set(photo.post_id, postPhotos)
  }
  for (const location of locations ?? []) {
    const postLocations = locationsByPostId.get(location.post_id) ?? []
    postLocations.push(location)
    locationsByPostId.set(location.post_id, postLocations)
  }

  return new Map(postIds.map((postId) => [postId, {
    photos: photosByPostId.get(postId) ?? [],
    locations: locationsByPostId.get(postId) ?? [],
    placesById,
  }]))
}

export async function getFeed(): Promise<Post[]> {
  const { data: posts, error } = await supabase.from('posts').select('*').order('created_at', { ascending: false })
  if (error) throw error
  const rows = posts ?? []
  const relationsByPostId = await getRelations(rows.map((post) => post.id))
  return rows.map((post) => toPost(post, relationsByPostId.get(post.id) ?? { photos: [], locations: [], placesById: new Map() }))
}

export async function getPostById(postId: string): Promise<Post | null> {
  const { data: post, error } = await supabase.from('posts').select('*').eq('id', postId).maybeSingle()
  if (error) throw error
  if (post == null) return null

  const relationsByPostId = await getRelations([post.id])
  return toPost(post, relationsByPostId.get(post.id) ?? { photos: [], locations: [], placesById: new Map() })
}

export interface PostPhotoInput {
  url: string
  storagePath: string
  placeId?: string | null
  isPublic: boolean
}

export interface CreatePostInput {
  tripId?: string | null
  title?: string | null
  description?: string | null
  placeIds?: string[]
  visibility: PostVisibility
  photos: PostPhotoInput[]
}

export async function createPost(input: CreatePostInput): Promise<Post> {
  const auth = getAuth()
  assert(auth != null, '인증 정보가 만료되었습니다.')

  const { data: post, error: postError } = await supabase
    .from('posts')
    .insert({
      author_id: auth.id,
      trip_id: input.tripId ?? null,
      title: input.title ?? null,
      description: input.description ?? null,
      visibility: input.visibility,
    })
    .select('id')
    .single()
  if (postError) throw postError

  const rollback = async () => {
    await supabase.from('posts').delete().eq('id', post.id)
  }

  if (input.placeIds != null && input.placeIds.length > 0) {
    const locations = input.placeIds.map((placeId, displayOrder) => ({
      post_id: post.id,
      place_id: placeId,
      display_order: displayOrder,
    }))
    const { error } = await supabase.from('post_locations').insert(locations)
    if (error) {
      await rollback()
      throw error
    }
  }

  if (input.photos.length > 0) {
    const photos = input.photos.map((photo, displayOrder) => ({
      post_id: post.id,
      display_order: displayOrder,
      url: photo.url,
      storage_path: photo.storagePath,
      place_id: photo.placeId ?? null,
      is_public: photo.isPublic,
    }))
    const { error } = await supabase.from('post_photos').insert(photos)
    if (error) {
      await rollback()
      throw error
    }
  }

  const createdPost = await getPostById(post.id)
  if (createdPost == null) throw new Error('포스트를 생성했지만 다시 조회할 수 없어요')
  return createdPost
}

export async function getLikeStatus(postId: string): Promise<{ count: number; liked: boolean }> {
  const auth = getAuth()
  const [{ count, error: countError }, { data: mine, error: mineError }] = await Promise.all([
    supabase.from('post_likes').select('post_id', { count: 'exact', head: true }).eq('post_id', postId),
    auth == null
      ? Promise.resolve({ data: null, error: null })
      : supabase.from('post_likes').select('post_id').eq('post_id', postId).eq('user_id', auth.id).maybeSingle(),
  ])
  if (countError) throw countError
  if (mineError) throw mineError
  return { count: count ?? 0, liked: mine != null }
}

export async function addLike(postId: string, userId: string): Promise<void> {
  const { error } = await supabase.from('post_likes').insert({ post_id: postId, user_id: userId })
  if (error && error.code !== '23505') throw error
}

export async function removeLike(postId: string, userId: string): Promise<void> {
  const { error } = await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', userId)
  if (error) throw error
}
