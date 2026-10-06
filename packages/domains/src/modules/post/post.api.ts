import { getAuth } from '../../gateways/auth'
import { supabase } from '../../gateways/client'
import { assert } from '@waylog/utility'
import { PostVisibility } from './post.types'
import type { Post } from './post.types'

export const postKey = 'posts'
export const postDetailKey = 'post-detail'
export const postLikeKey = 'post-likes'

export interface PostRpcRow {
  id: string
  author_id: string
  trip_id: string | null
  title: string | null
  description: string | null
  visibility: PostVisibility
  like_count: number
  liked_by_me: boolean
  created_at: string
  updated_at: string | null
  photos: { url: string; storage_path: string; place_id: string | null; is_public: boolean }[]
  places: { place_id: string; name: string; lat: number; lng: number; address: string | null }[]
}

export function toPost(row: PostRpcRow): Post {
  return {
    id: row.id,
    authorId: row.author_id,
    tripId: row.trip_id,
    title: row.title,
    description: row.description,
    places: row.places.map((place) => ({
      placeId: place.place_id,
      name: place.name,
      lat: place.lat,
      lng: place.lng,
      address: place.address,
    })),
    visibility: row.visibility,
    photos: row.photos.map((photo) => ({
      url: photo.url,
      storagePath: photo.storage_path,
      placeId: photo.place_id,
      isPublic: photo.is_public,
    })),
    likeCount: row.like_count,
    likedByMe: row.liked_by_me,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

interface PostsFilter {
  postId?: string
  authorId?: string
  placeId?: string
  publicOnly?: boolean
}

async function getPosts({ postId, authorId, placeId, publicOnly }: PostsFilter): Promise<Post[]> {
  const { data, error } = await supabase
    .rpc('get_posts', {
      p_post_id: postId,
      p_author_id: authorId,
      p_place_id: placeId,
      p_public_only: publicOnly,
    })
    .overrideTypes<PostRpcRow[], { merge: false }>()
  if (error) throw error
  return data.map(toPost)
}

export function getFeed(authorId?: string): Promise<Post[]> {
  return getPosts({ authorId })
}

export function getPlaceFeed(placeId: string): Promise<Post[]> {
  return getPosts({ placeId, publicOnly: true })
}

export async function getPostById(postId: string): Promise<Post | null> {
  const [post] = await getPosts({ postId })
  return post ?? null
}

export interface PostPhotoInput {
  url: string
  storagePath: string
  placeId?: string | null
  isPublic: boolean
  /** 여행 사진첩에서 고른 사진의 원본 id. 공개 포스트면 원본도 공개로 바꾼다. */
  savedPhotoId?: string
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

  // 공개 포스트에 쓴 여행 사진은 장소 상세에도 노출되어야 하므로 원본도 공개로 바꾼다.
  const savedPhotoIds = input.photos.flatMap((photo) => photo.savedPhotoId ?? [])
  if (input.visibility === PostVisibility.PUBLIC && savedPhotoIds.length > 0) {
    const { error } = await supabase.from('photos').update({ is_public: true }).in('id', savedPhotoIds)
    if (error) {
      await rollback()
      throw error
    }
  }

  const createdPost = await getPostById(post.id)
  if (createdPost == null) throw new Error('포스트를 생성했지만 다시 조회할 수 없어요')
  return createdPost
}

export async function deletePost(postId: string): Promise<void> {
  const { data: photos } = await supabase.from('post_photos').select('storage_path').eq('post_id', postId)

  const { error } = await supabase.from('posts').delete().eq('id', postId)
  if (error) throw error

  if (photos && photos.length > 0) {
    const storagePaths = photos.map((p) => p.storage_path)
    await supabase.functions.invoke('storage-delete', {
      body: { storagePaths },
    })
  }
}

export async function addLike(postId: string, userId: string): Promise<void> {
  const { error } = await supabase.from('post_likes').insert({ post_id: postId, user_id: userId })
  if (error && error.code !== '23505') throw error
}

export async function removeLike(postId: string, userId: string): Promise<void> {
  const { error } = await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', userId)
  if (error) throw error
}
