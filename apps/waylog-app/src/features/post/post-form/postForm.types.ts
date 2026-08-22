import type { PostVisibility } from '@waylog/domains/modules/post'

export interface DraftPostPhoto {
  id: string
  source: 'saved' | 'local'
  uri: string
  placeId: string | null
  savedPhotoId?: string
}

export interface PostPlaceSelection {
  placeId: string
  name: string
  address: string | null
}

export interface PostMetaValue {
  description: string
  places: PostPlaceSelection[]
  visibility: PostVisibility
}
