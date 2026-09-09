import type { PostVisibility } from '@waylog/domains/modules/post'

// 앱은 웹과 달리 업로드가 uri 문자열 하나만 받으므로 로컬·저장 사진을 나누지 않는다.
// savedPhotoId 가 있으면 이미 저장된 사진이고, 공개 전환 시 원본도 함께 바꿔야 한다.
export interface PostFormPhoto {
  id: string
  uri: string
  placeId: string | null
  savedPhotoId?: string
}

export interface PostPlaceSelection {
  placeId: string
  name: string
  address: string | null
}

export const POST_FORM_STEPS = ['trip', 'photo', 'meta'] as const

export type PostFormStep = (typeof POST_FORM_STEPS)[number]

export interface PostFormValues {
  tripId: string | null
  photos: PostFormPhoto[]
  places: PostPlaceSelection[]
  visibility: PostVisibility
  description: string
}
