import { supabase } from '@waylog/domains/api'
import type { DataRaw } from '@waylog/domains/api'
import type { Post, PostPhoto, PostPlace, PostVisibility } from './post.types'
import { getAuth } from '@waylog/domains/auth'
import { assert } from '@waylog/domains/utils'

export const postKey = 'posts'
export const postLikeKey = 'post-likes'

type PostRow = DataRaw<'posts'>

interface PostPhotoRow {
  display_order: number
  url: string
  storage_path: string
  place_id: string | null
  is_public: boolean
}

interface PostLocationRow {
  display_order: number
  places: {
    id: string
    name: string
    lat: number
    lng: number
    address: string | null
  }
}

type PostWithJoins = PostRow & {
  post_photos: PostPhotoRow[]
  post_locations: PostLocationRow[]
}

const POST_SELECT = `
  *,
  post_photos(display_order, url, storage_path, place_id, is_public),
  post_locations(display_order, places!inner(id, name, lat, lng, address))
` as const

function toPost(row: PostWithJoins): Post {
  const photos: PostPhoto[] = [...row.post_photos]
    .sort((a, b) => a.display_order - b.display_order)
    .map((link) => ({
      url: link.url,
      storagePath: link.storage_path,
      placeId: link.place_id,
      isPublic: link.is_public,
    }))

  const places: PostPlace[] = [...row.post_locations]
    .sort((a, b) => a.display_order - b.display_order)
    .map((link) => ({
      placeId: link.places.id,
      name: link.places.name,
      lat: link.places.lat,
      lng: link.places.lng,
      address: link.places.address,
    }))

  return {
    id: row.id,
    authorId: row.author_id,
    tripId: row.trip_id,
    title: row.title,
    description: row.description,
    places,
    visibility: row.visibility,
    photos,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function getPostById(postId: string): Promise<Post | null> {
  const { data, error } = await supabase
    .from('posts')
    .select(POST_SELECT)
    .eq('id', postId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null
  return toPost(data as unknown as PostWithJoins)
}

export async function getFeed(): Promise<Post[]> {
  const { data, error } = await supabase
    .from('posts')
    .select(POST_SELECT)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map((row) => toPost(row as unknown as PostWithJoins))
}

export async function getUserFeed(userId: string): Promise<Post[]> {
  // RLS가 가시성을 책임짐 — 본인이면 전체, 타인이면 PUBLIC + (해당 trip 멤버라면 MEMBERS)
  const { data, error } = await supabase
    .from('posts')
    .select(POST_SELECT)
    .eq('author_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map((row) => toPost(row as unknown as PostWithJoins))
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
  /** 전역 places(id) 배열. 표시 순서대로 전달한다. */
  placeIds?: string[]
  visibility: PostVisibility
  photos: PostPhotoInput[]
}

export async function createPost(input: CreatePostInput): Promise<Post> {
  const auth = getAuth()
  assert(!!auth, '인증 정보가 만료되었습니다.')

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

  if (input.placeIds && input.placeIds.length > 0) {
    const locationRows = input.placeIds.map((placeId, index) => ({
      post_id: post.id,
      place_id: placeId,
      display_order: index,
    }))
    const { error: locError } = await supabase.from('post_locations').insert(locationRows)
    if (locError) {
      await rollback()
      throw locError
    }
  }

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
      await rollback()
      throw linkError
    }
  }

  const created = await getPostById(post.id)
  if (!created) throw new Error('포스트를 생성했지만 다시 조회할 수 없어요')
  return created
}

export async function deletePost(postId: string): Promise<void> {
  const { data: photos } = await supabase
    .from('post_photos')
    .select('storage_path')
    .eq('post_id', postId)

  const { error } = await supabase.from('posts').delete().eq('id', postId)
  if (error) throw error

  if (photos && photos.length > 0) {
    const storagePaths = photos.map((p) => p.storage_path)
    await supabase.functions.invoke('storage-delete', { body: { storagePaths } })
  }
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
