import { supabase } from '~api/client'
import type { DataRaw } from '~api/tables.types'
import type { PhotoPost, PostScope, PostVisibility } from './post.types'

export const postKey = 'posts'
export const postLikeKey = 'post-likes'

type PostRow = DataRaw<'photo_posts'>
type PostPhotoRow = DataRaw<'post_photos'>

function toPostScope(row: Pick<PostRow, 'place_id' | 'location_id'>): PostScope | null {
  if (row.place_id) return { kind: 'PLACE', placeId: row.place_id }
  if (row.location_id) return { kind: 'LOCATION', locationId: row.location_id }
  return null
}

function toPhotoPost(row: PostRow, photoLinks: Pick<PostPhotoRow, 'photo_id' | 'display_order'>[]): PhotoPost {
  const photoIds = [...photoLinks]
    .sort((a, b) => a.display_order - b.display_order)
    .map(link => link.photo_id)

  return {
    id: row.id,
    authorId: row.author_id,
    tripId: row.trip_id,
    title: row.title,
    description: row.description,
    coverPhotoId: row.cover_photo_id,
    scope: toPostScope(row),
    visibility: row.visibility,
    photoIds,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

type PostWithPhotos = PostRow & {
  post_photos: Pick<PostPhotoRow, 'photo_id' | 'display_order'>[]
}

const POST_SELECT = '*, post_photos(photo_id, display_order)'

export async function getPostById(postId: string): Promise<PhotoPost | null> {
  const { data, error } = await supabase
    .from('photo_posts')
    .select(POST_SELECT)
    .eq('id', postId)
    .maybeSingle<PostWithPhotos>()

  if (error) throw error
  if (!data) return null
  return toPhotoPost(data, data.post_photos)
}

export async function getPublicFeed(): Promise<PhotoPost[]> {
  const { data, error } = await supabase
    .from('photo_posts')
    .select(POST_SELECT)
    .eq('visibility', 'PUBLIC')
    .order('created_at', { ascending: false })
    .returns<PostWithPhotos[]>()

  if (error) throw error
  return (data ?? []).map(row => toPhotoPost(row, row.post_photos))
}

export async function getUserFeed(userId: string): Promise<PhotoPost[]> {
  // RLS가 가시성을 책임짐 — 본인이면 전체, 타인이면 PUBLIC + (해당 trip 멤버라면 MEMBERS)
  const { data, error } = await supabase
    .from('photo_posts')
    .select(POST_SELECT)
    .eq('author_id', userId)
    .order('created_at', { ascending: false })
    .returns<PostWithPhotos[]>()

  if (error) throw error
  return (data ?? []).map(row => toPhotoPost(row, row.post_photos))
}

export interface CreatePostInput {
  authorId: string
  tripId?: string | null
  title?: string | null
  description?: string | null
  scope?: PostScope | null
  visibility: PostVisibility
  photoIds: string[]
  coverPhotoId?: string | null
}

export async function createPost(input: CreatePostInput): Promise<PhotoPost> {
  const placeId = input.scope?.kind === 'PLACE' ? input.scope.placeId : null
  const locationId = input.scope?.kind === 'LOCATION' ? input.scope.locationId : null
  const coverPhotoId = input.coverPhotoId ?? input.photoIds[0] ?? null

  const { data: post, error: postError } = await supabase
    .from('photo_posts')
    .insert({
      author_id: input.authorId,
      trip_id: input.tripId ?? null,
      title: input.title ?? null,
      description: input.description ?? null,
      cover_photo_id: coverPhotoId,
      place_id: placeId,
      location_id: locationId,
      visibility: input.visibility,
    })
    .select('*')
    .single()

  if (postError) throw postError

  if (input.photoIds.length > 0) {
    const links = input.photoIds.map((photoId, index) => ({
      post_id: post.id,
      photo_id: photoId,
      display_order: index,
    }))

    const { error: linkError } = await supabase.from('post_photos').insert(links)
    if (linkError) {
      await supabase.from('photo_posts').delete().eq('id', post.id)
      throw linkError
    }
  }

  return toPhotoPost(
    post,
    input.photoIds.map((photoId, index) => ({ photo_id: photoId, display_order: index })),
  )
}

export async function deletePost(postId: string): Promise<void> {
  const { error } = await supabase.from('photo_posts').delete().eq('id', postId)
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
