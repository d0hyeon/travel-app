import type { PlaceCategoryType } from '@waylog/domains/modules/place'

export interface RoutePlaceFormValues {
  startTime: string | null
  endTime: string | null
  routeMemo: string
  category: PlaceCategoryType | null
  placeMemo: string
}
