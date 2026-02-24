import { reverseKeyValue } from "../../shared/utils/common";
import type { ValueOf } from "../../shared/utils/types";

export type PlaceStatus = 'wished' | 'confirmed'

export const PlaceCategoryType = {
  음식점: 'food',
  카페: 'cafe',
  숲: 'forest',
  바다: 'see',
  액티비티: 'activity',
  쇼핑: 'shopping',
  숙소: 'accommodation',
  기타: 'etc',
  관광지: 'tourist',
  술: 'drinks',
} as const;
export type PlaceCategoryType = ValueOf<typeof PlaceCategoryType>;
export const PlaceCategoryTypes = Object.values(PlaceCategoryType);
export const PlaceCategoryTypeLabel = reverseKeyValue(PlaceCategoryType);

export const PlaceCategoryColorCode = {
  [PlaceCategoryType.음식점]: '#EB5757', // 차분한 로즈 레드
  [PlaceCategoryType.카페]: '#A1887F',   // 부드러운 코코아 브라운
  [PlaceCategoryType.숲]: '#66BB6A',     // 싱그러운 리프 그린
  [PlaceCategoryType.바다]: '#5DADE2',   // 깊이감 있는 스카이 블루
  [PlaceCategoryType.쇼핑]: '#BA68C8',   // 세련된 오키드 퍼플
  [PlaceCategoryType.액티비티]: '#F2C94C', // 가독성을 잡은 머스타드 옐로우
  [PlaceCategoryType.관광지]: '#F2994A', // 따뜻한 테라코타 오렌지
  [PlaceCategoryType.숙소]: '#F06292',   // 차분한 딥 핑크
  [PlaceCategoryType.술]: '#7986CB',     // 분위기 있는 데님 블루
  [PlaceCategoryType.기타]: '#9E9E9E',   // 모던한 미디엄 그레이
} satisfies Record<PlaceCategoryType, string>;

export interface PlaceCategory {
  type: PlaceCategoryType
  label: string
  color: string
}


export interface Place {
  id: string
  tripId: string
  name: string
  address: string
  lat: number
  lng: number
  status: PlaceStatus
  category?: PlaceCategoryType;
  tags: string[]
  memo: string
  scheduledDate?: string // ISO date
  createdAt: string
}
