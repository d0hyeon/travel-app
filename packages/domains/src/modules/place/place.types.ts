import { reverseKeyValue } from "../../utils";
import type { ValueOf } from "../../utils";

export type PlaceStatus = 'wished' | 'confirmed'

export const PlaceCategoryType = {
  음식점: 'food',
  카페: 'cafe',
  숲: 'forest',
  산: 'mountain',
  바다: 'see',
  액티비티: 'activity',
  쇼핑: 'shopping',
  숙소: 'accommodation',
  기타: 'etc',
  관광지: 'tourist',
  술: 'drinks',
  대중교통: 'transit'
} as const;
export type PlaceCategoryType = ValueOf<typeof PlaceCategoryType>;
export const PlaceCategoryTypes = Object.values(PlaceCategoryType);
export const PlaceCategoryTypeLabel = reverseKeyValue(PlaceCategoryType);

export const PlaceCategoryColorCode = {
  [PlaceCategoryType.음식점]: '#EB5757', // 차분한 로즈 레드
  [PlaceCategoryType.카페]: '#A1887F',   // 부드러운 코코아 브라운
  [PlaceCategoryType.숲]: '#66BB6A',     // 싱그러운 리프 그린
  [PlaceCategoryType.산]: '#1f5933',     // 싱그러운 리프 그린
  [PlaceCategoryType.바다]: '#5DADE2',   // 깊이감 있는 스카이 블루
  [PlaceCategoryType.쇼핑]: '#BA68C8',   // 세련된 오키드 퍼플
  [PlaceCategoryType.액티비티]: '#F2C94C', // 가독성을 잡은 머스타드 옐로우
  [PlaceCategoryType.관광지]: '#F2994A', // 따뜻한 테라코타 오렌지
  [PlaceCategoryType.숙소]: '#F06292',   // 차분한 딥 핑크
  [PlaceCategoryType.술]: '#7986CB',     // 분위기 있는 데님 블루
  [PlaceCategoryType.기타]: '#9E9E9E',   // 모던한 미디엄 그레이
  [PlaceCategoryType.대중교통]: '#62b9c4'
} satisfies Record<PlaceCategoryType, string>;

export interface PlaceCategory {
  type: PlaceCategoryType
  label: string
  color: string
}


/** 전역 POI. 특정 여행에 종속되지 않음 */
export interface Place {
  id: string
  name: string
  address: string
  lat: number
  lng: number
  provider: string
  externalId: string
  createdAt: string
}

/** 여행-장소 연결. places JOIN trip_places의 결합 모델 */
export interface TripPlace {
  id: string             // trip_places.id
  placeId: string        // places.id
  tripId: string
  name: string           // from places
  address: string        // from places
  lat: number            // from places
  lng: number            // from places
  status: PlaceStatus
  category?: PlaceCategoryType
  tags: string[]
  memo: string
  createdAt: string      // trip_places.created_at
}
