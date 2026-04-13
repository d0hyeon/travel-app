/**
 * 좌표가 한국 영역인지 판단
 * 대략적인 한국 영역: 위도 33~39, 경도 124~132
 */
export function isKoreaCoordinate(lat: number, lng: number): boolean {
  return lat >= 33 && lat <= 39 && lng >= 124 && lng <= 132;
}

/**
 * 좌표 기반으로 해외 여부 판단
 */
export function isOverseasByCoordinate(lat: number, lng: number): boolean {
  return !isKoreaCoordinate(lat, lng);
}

/**
 * Haversine 공식으로 두 좌표 간 거리(m) 계산
 */
export function calcDistance(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 6371000
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const sinDLat = Math.sin(dLat / 2)
  const sinDLng = Math.sin(dLng / 2)
  const x = sinDLat * sinDLat + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinDLng * sinDLng
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}
