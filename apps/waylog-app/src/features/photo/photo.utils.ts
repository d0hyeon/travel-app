import { findNearestPlace } from '@waylog/domains/modules/trip'
import { toCoordinate } from './exif.utils'

// 웹과 같은 거리 기준을 쓴다 — web/features/photo/photo.utils.ts
const PLACE_MATCH_DISTANCE_LIMIT = 500

/**
 * 사진에 찍힌 좌표로 여행 장소를 추정한다.
 *
 * 웹 findNearestPlaceFromPhoto 와 같은 동작이지만 입력이 다르다.
 * 웹은 File 을 받아 exifr 로 파싱하고, 앱은 picker 가 이미 읽어 준 EXIF 를 받는다.
 */
export function findNearestPlaceFromPhoto(
  exif: Record<string, unknown> | null | undefined,
  places: Array<{ placeId: string; lat: number; lng: number }>,
): string | undefined {
  const coordinate = toCoordinate(exif)
  if (coordinate == null) return undefined

  const nearest = findNearestPlace(coordinate, places, {
    withinMeters: PLACE_MATCH_DISTANCE_LIMIT,
  })

  return nearest?.placeId
}
