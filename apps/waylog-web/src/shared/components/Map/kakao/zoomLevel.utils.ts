// 카카오는 레벨이 작을수록 확대된다. 구글·Mapbox 표준(클수록 확대)과 반전 관계이며,
// 이 파일이 그 반전을 완결한다 — 카카오 밖으로 이 상수나 변환을 내보내지 않는다.
export const KAKAO_LEVEL_MAX = 22;

export function zoomToKakaoLevel(zoom: number): number {
  return KAKAO_LEVEL_MAX - zoom;
}

export function kakaoLevelToZoom(level: number): number {
  return KAKAO_LEVEL_MAX - level;
}
