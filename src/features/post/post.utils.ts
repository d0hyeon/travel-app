import type { Photo } from '~features/photo/photo.types'
import type { PostScope } from './post.types'

/**
 * 사진들의 placeId로 포스트 scope를 추천한다.
 *
 * 1차 단순화: 모든 사진이 같은 placeId를 갖는 경우만 PLACE 추천.
 * 그 외(여러 place / placeId 없음)는 null — 사용자가 직접 선택.
 *
 * Location 단위 자동 추론은 place→location 매핑 도입 후 다음 단계에서.
 */
export function suggestScope(photos: Pick<Photo, 'placeId'>[]): PostScope | null {
  const placeIds = Array.from(
    new Set(photos.map(p => p.placeId).filter((id): id is string => id != null)),
  )
  if (placeIds.length === 1) return { kind: 'PLACE', placeId: placeIds[0] }
  return null
}
