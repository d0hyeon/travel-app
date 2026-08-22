import type { Coordinate } from '@waylog/utility'

/**
 * expo-image-picker 가 준 EXIF 에서 GPS 좌표를 뽑는다.
 * 좌표가 없거나 형식을 알아볼 수 없으면 null.
 *
 * 웹은 exifr 로 File 을 직접 파싱하지만(`~shared/utils/exif`),
 * 앱은 picker 가 EXIF 를 이미 읽어 준다. 별도 파싱 라이브러리를 쓰지 않는다.
 *
 * 호출 시점은 리사이즈 이전이어야 한다.
 * ImageManipulator 를 거치면 EXIF 가 사라진다 — photo.api 의 resize 참조.
 */
export function toCoordinate(
  exif: Record<string, unknown> | null | undefined,
): Coordinate | null {
  if (exif == null) return null

  const lat = toDegrees(exif.GPSLatitude, exif.GPSLatitudeRef, 'S')
  const lng = toDegrees(exif.GPSLongitude, exif.GPSLongitudeRef, 'W')
  if (lat == null || lng == null) return null

  return { lat, lng }
}

/**
 * EXIF GPS 값을 부호 있는 십진 도수로 바꾼다.
 *
 * 플랫폼마다 형태가 다르다.
 * - iOS: 45.123 (항상 양수) + ref "N"/"S"
 * - Android: -45.123 (부호 포함) 또는 "45/1,7/1,234/100" (도/분/초)
 */
function toDegrees(
  value: unknown,
  ref: unknown,
  negativeRef: 'S' | 'W',
): number | null {
  const magnitude = typeof value === 'number' ? value : parseSexagesimal(value)
  if (magnitude == null || Number.isNaN(magnitude)) return null

  // 부호가 이미 값에 실려 있으면 ref 를 다시 적용하지 않는다.
  if (magnitude < 0) return magnitude

  return ref === negativeRef ? -magnitude : magnitude
}

/** "45/1,7/1,234/100" 또는 "45,7,2.34" 형태의 도/분/초를 십진 도수로 바꾼다. */
function parseSexagesimal(value: unknown): number | null {
  if (typeof value !== 'string') return null

  const parts = value.split(',').map((part) => {
    const [numerator, denominator] = part.split('/')
    return denominator == null ? Number(numerator) : Number(numerator) / Number(denominator)
  })

  if (parts.length === 0 || parts.some(Number.isNaN)) return null

  const [degrees, minutes = 0, seconds = 0] = parts
  return degrees + minutes / 60 + seconds / 3600
}
