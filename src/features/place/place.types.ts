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
  [PlaceCategoryType.음식점]: '#e11010',
  [PlaceCategoryType.카페]: '#8d6e63',
  [PlaceCategoryType.숲]: '#00a413',
  [PlaceCategoryType.바다]: '#2e2ca6',
  [PlaceCategoryType.쇼핑]: '#7b1fa2',
  [PlaceCategoryType.액티비티]: '#f1d500',
  [PlaceCategoryType.관광지]: '#f98900',
  [PlaceCategoryType.숙소]: '#ff07d6',
  [PlaceCategoryType.술]: '#455a64',
  [PlaceCategoryType.기타]: '#757575',
} satisfies Record<PlaceCategoryType, string>

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
