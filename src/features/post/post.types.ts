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
  /** post_photos를 display_order 정렬해 채움 */
  photoIds: string[]
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
