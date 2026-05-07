export const PostVisibility = {
  PRIVATE: 'PRIVATE',
  MEMBERS: 'MEMBERS',
  PUBLIC: 'PUBLIC',
} as const
export type PostVisibility = typeof PostVisibility[keyof typeof PostVisibility]

export type PostScope =
  | { kind: 'PLACE'; placeId: string }
  | { kind: 'LOCATION'; locationId: string }

export interface PostLocation {
  name: string
  lat: number
  lng: number
  address: string | null
}

export interface PostPhoto {
  url: string
  storagePath: string
  placeId: string | null
  isPublic: boolean
}

export interface Post {
  id: string
  authorId: string
  tripId: string | null
  title: string | null
  description: string | null
  scope: PostScope | null
  location: PostLocation | null
  visibility: PostVisibility
  /** display_order 정렬됨 */
  photos: PostPhoto[]
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
