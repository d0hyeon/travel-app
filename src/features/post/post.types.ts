import type { Photo } from '~features/photo/photo.types'

export const PostVisibility = {
  PRIVATE: 'PRIVATE',
  MEMBERS: 'MEMBERS',
  PUBLIC: 'PUBLIC',
} as const
export type PostVisibility = typeof PostVisibility[keyof typeof PostVisibility]

export type PostScope =
  | { kind: 'PLACE'; placeId: string }
  | { kind: 'LOCATION'; locationId: string }

export interface PhotoPost {
  id: string
  authorId: string
  tripId: string | null
  title: string | null
  description: string | null
  coverPhotoId: string | null
  scope: PostScope | null
  visibility: PostVisibility
  /** display_order 정렬됨. 호출부는 사진 id가 필요하면 photos[i].id로 접근 */
  photos: Photo[]
  createdAt: string
  updatedAt: string | null
}

export interface PostComment {
  id: string
  postId: string
  authorId: string
  content: string
  createdAt: string
  updatedAt: string | null
}
