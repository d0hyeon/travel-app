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
