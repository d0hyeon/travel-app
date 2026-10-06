export const PostVisibility = {
  PRIVATE: 'PRIVATE',
  MEMBERS: 'MEMBERS',
  PUBLIC: 'PUBLIC',
} as const

export type PostVisibility = typeof PostVisibility[keyof typeof PostVisibility]

export interface PostPlace {
  placeId: string
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
  places: PostPlace[]
  visibility: PostVisibility
  photos: PostPhoto[]
  likeCount: number
  likedByMe: boolean
  createdAt: string
  updatedAt: string | null
}

export interface PostLikeStatus {
  count: number
  liked: boolean
}

export interface PostCursor {
  createdAt: string
  id: string
}
