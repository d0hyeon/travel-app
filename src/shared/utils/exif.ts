import { gps } from 'exifr'
import type { Coordinate } from '~shared/types/coordinate'

/**
 * 이미지 파일의 EXIF GPS 좌표 추출.
 * 좌표가 없거나 EXIF 파싱에 실패하면 null.
 *
 * 호출 시점은 resize/transform 이전이어야 한다.
 * react-image-file-resizer 등 캔버스 기반 가공은 EXIF를 제거한다.
 */
export async function extractGps(file: File): Promise<Coordinate | null> {
  try {
    const result = await gps(file)
    if (!result) return null
    if (typeof result.latitude !== 'number' || typeof result.longitude !== 'number') return null
    return { lat: result.latitude, lng: result.longitude }
  } catch {
    return null
  }
}
