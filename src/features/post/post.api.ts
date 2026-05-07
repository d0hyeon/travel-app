import { supabase } from '~api/client'
import type { DataRaw } from '~api/tables.types'
import { getCoordinateByLocation, isLocation } from '~features/location'
import type { Post, PostLocation, PostPhoto, PostScope, PostVisibility } from './post.types'
import { getAuth } from '~features/auth/useAuth'
import { assert } from '~shared/utils/types'

export const postKey = 'posts'
export const postLikeKey = 'post-likes'
const POSTS_TABLE = 'posts' as const
const LEGACY_POSTS_TABLE = 'photo_posts' as const

type PostRow = DataRaw<'posts'>

function toPostScope(row: Pick<PostRow, 'place_id' | 'location_id'>): PostScope | null {
  if (row.place_id) return { kind: 'PLACE', placeId: row.place_id }
  if (row.location_id) return { kind: 'LOCATION', locationId: row.location_id }
  return null
}

interface PostPhotoRow {
  display_order: number
  url: string
  storage_path: string
  place_id: string | null
  is_public: boolean
}

interface PostLocationPlaceRow {
  id: string
  name: string
  lat: number
  lng: number
  address: string | null
}

type PostWithPhotos = PostRow & {
  post_photos: PostPhotoRow[]
}

type PostTableName = typeof POSTS_TABLE | typeof LEGACY_POSTS_TABLE

function isMissingPostsTableError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false

  const maybeMessage = 'message' in error && typeof error.message === 'string'
    ? error.message
    : ''

  return maybeMessage.includes('relation') && maybeMessage.includes('posts') && maybeMessage.includes('does not exist')
}

async function withPostTableFallback<T>(
  run: (table: PostTableName) => Promise<{ data: T; error: unknown }>
): Promise<{ data: T; error: unknown; table: PostTableName }> {
  const primary = await run(POSTS_TABLE)
  if (!isMissingPostsTableError(primary.error)) {
    return { ...primary, table: POSTS_TABLE }
  }

  const legacy = await run(LEGACY_POSTS_TABLE)
  return { ...legacy, table: LEGACY_POSTS_TABLE }
}

function toPost(row: PostWithPhotos): Post {
  const photos: PostPhoto[] = [...row.post_photos]
    .sort((a, b) => a.display_order - b.display_order)
    .map(link => ({
      url: link.url,
      storagePath: link.storage_path,
      placeId: link.place_id,
      isPublic: link.is_public,
    }))

  const scope = toPostScope(row)

  return {
    id: row.id,
    authorId: row.author_id,
    tripId: row.trip_id,
    title: row.title,
    description: row.description,
    scope,
    location: toPostLocation(scope),
    visibility: row.visibility,
    photos,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function toPostLocation(scope: PostScope | null, place?: PostLocationPlaceRow): PostLocation | null {
  if (scope == null) return null

  if (scope.kind === 'PLACE') {
    if (!place) return null
    return {
      name: place.name,
      lat: place.lat,
      lng: place.lng,
      address: place.address,
    }
  }

  if (isLocation(scope.locationId)) {
    const coordinate = getCoordinateByLocation(scope.locationId)
    return {
      name: scope.locationId,
      lat: coordinate.lat,
      lng: coordinate.lng,
      address: null,
    }
  }

  return {
    name: scope.locationId,
    lat: null,
    lng: null,
    address: null,
  }
}

async function hydratePostLocations(posts: Post[]): Promise<Post[]> {
  const placeIds = Array.from(
    new Set(
      posts
        .map((post) => post.scope)
        .filter((scope): scope is Extract<PostScope, { kind: 'PLACE' }> => scope?.kind === 'PLACE')
        .map((scope) => scope.placeId),
    ),
  )

  if (placeIds.length === 0) {
    return posts.map((post) => ({
      ...post,
      location: toPostLocation(post.scope),
    }))
  }

  const { data: places, error } = await supabase
    .from('places')
    .select('id, name, lat, lng, address')
    .in('id', placeIds)

  if (error) throw error

  const placesById = new Map((places ?? []).map((place) => [place.id, place]))

  return posts.map((post) => ({
    ...post,
    location: post.scope?.kind === 'PLACE'
      ? toPostLocation(post.scope, placesById.get(post.scope.placeId))
      : toPostLocation(post.scope),
  }))
}

const POST_SELECT = '*, post_photos(display_order, url, storage_path, place_id, is_public)'

export async function getPostById(postId: string): Promise<Post | null> {
  const { data, error } = await withPostTableFallback<PostWithPhotos | null>((table) =>
    (supabase as any)
      .from(table)
      .select(POST_SELECT)
      .eq('id', postId)
      .maybeSingle()
  )

  if (error) throw error
  if (!data) return null
  const [post] = await hydratePostLocations([toPost(data)])
  return post ?? null
}

export async function getFeed(): Promise<Post[]> {
  const { data, error } = await withPostTableFallback<PostWithPhotos[]>((table) =>
    (supabase as any)
      .from(table)
      .select(POST_SELECT)
      .order('created_at', { ascending: false })
  )

  if (error) throw error
  return hydratePostLocations((data ?? []).map(toPost))
}

export async function getUserFeed(userId: string): Promise<Post[]> {
  // RLS가 가시성을 책임짐 — 본인이면 전체, 타인이면 PUBLIC + (해당 trip 멤버라면 MEMBERS)
  const { data, error } = await withPostTableFallback<PostWithPhotos[]>((table) =>
    (supabase as any)
      .from(table)
      .select(POST_SELECT)
      .eq('author_id', userId)
      .order('created_at', { ascending: false })
  )

  if (error) throw error
  return hydratePostLocations((data ?? []).map(toPost))
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
  scope?: PostScope | null
  visibility: PostVisibility
  photos: PostPhotoInput[]
}

export async function createPost(input: CreatePostInput): Promise<Post> {
  const auth = getAuth();
  assert(!!auth, '인증 정보가 만료되었습니다.')
  const placeId = input.scope?.kind === 'PLACE' ? input.scope.placeId : null
  const locationId = input.scope?.kind === 'LOCATION' ? input.scope.locationId : null

  
  const { data: post, error: postError, table } = await withPostTableFallback<PostRow>((postTable) =>
    (supabase as any)
      .from(postTable)
      .insert({
        author_id: auth.id,
        trip_id: input.tripId ?? null,
        title: input.title ?? null,
        description: input.description ?? null,
        place_id: placeId,
        location_id: locationId,
        visibility: input.visibility,
      })
      .select('*')
      .single()
  )

  if (postError) throw postError

  if (input.photos.length > 0) {
    const links = input.photos.map((photo, index) => ({
      post_id: post.id,
      display_order: index,
      url: photo.url,
      storage_path: photo.storagePath,
      place_id: photo.placeId ?? null,
      is_public: photo.isPublic,
    }))

    const { error: linkError } = await supabase.from('post_photos').insert(links)
    if (linkError) {
      await (supabase as any).from(table).delete().eq('id', post.id)
      throw linkError
    }
  }

  const created = await getPostById(post.id)
  if (!created) throw new Error('포스트를 생성했지만 다시 조회할 수 없어요')
  return created
}

export async function deletePost(postId: string): Promise<void> {
  const { error } = await withPostTableFallback<null>((table) =>
    (supabase as any).from(table).delete().eq('id', postId).select().maybeSingle()
  )
  if (error) throw error
}

export async function getLikeStatus(postId: string, userId: string): Promise<{ count: number; liked: boolean }> {
  const [{ count, error: countError }, { data: mine, error: mineError }] = await Promise.all([
    supabase.from('post_likes').select('post_id', { count: 'exact', head: true }).eq('post_id', postId),
    supabase.from('post_likes').select('post_id').eq('post_id', postId).eq('user_id', userId).maybeSingle(),
  ])

  if (countError) throw countError
  if (mineError) throw mineError

  return { count: count ?? 0, liked: mine != null }
}

export async function addLike(postId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('post_likes')
    .insert({ post_id: postId, user_id: userId })

  if (error && error.code !== '23505') throw error
}

export async function removeLike(postId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('post_likes')
    .delete()
    .eq('post_id', postId)
    .eq('user_id', userId)

  if (error) throw error
}
