import { reverseKeyValue } from "../utils";
import type { ValueOf } from "../utils";

export const TransportType = {
  도보: 'walk',
  차량: 'car'
} as const;
export type TransportType = ValueOf<typeof TransportType>;
export const TransportTypeLabel = reverseKeyValue(TransportType);

// 인접 경유지 사이의 이동 정보 (waypoints.length - 1 개)
export interface RouteLeg {
  /** 이동 시간 (단위 : 초) */
  duration: number // 초
  /** 이동 거리 (단위 : 미터) */
  distance: number // 미터
  transport: TransportType // 이 구간의 이동수단
  coordinates: { lat: number; lng: number }[] // 이 구간의 도로 폴리라인 좌표열
}

// 도로 기반 경로: 폴리라인 좌표와 구간별 이동 정보
export interface RoadRoute {
  coordinates: { lat: number; lng: number }[]
  legs: RouteLeg[]
}

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
