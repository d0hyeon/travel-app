import type { PlaceCategoryType, PlaceStatus } from './place.types';

export interface TripPlacePatchInput {
  status?: PlaceStatus;
  memo?: string;
  tags?: string[];
  /** null은 "미설정으로 지정", undefined는 "수정하지 않음" */
  category?: PlaceCategoryType | null;
}

/**
 * 전달된 필드만 담은 patch를 만든다.
 *
 * undefined는 키 자체를 만들지 않아야 한다. 키가 생기면 다른 사람이
 * 방금 설정한 값을 덮어쓴다.
 */
export function toTripPlacePatch(
  data: TripPlacePatchInput,
): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  if (data.status !== undefined) patch.status = data.status;
  if (data.memo !== undefined) patch.memo = data.memo || null;
  if (data.tags !== undefined) patch.tags = data.tags;
  if (data.category !== undefined) patch.category = data.category;
  return patch;
}
