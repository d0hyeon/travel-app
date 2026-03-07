export interface Route {
  id: string
  tripId: string
  name: string
  placeIds: string[] // 순서대로
  placeMemos: Record<string, string[]> // placeId -> memos (경로별 장소 메모 리스트)
  isMain: boolean
  scheduledDate?: string // ISO date
  createdAt: string
  hiddenPlaces: string[];
}
