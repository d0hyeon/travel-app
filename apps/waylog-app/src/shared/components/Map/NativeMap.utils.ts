import type { Coordinate } from "@waylog/domains/modules/map";

// 웹은 level(1~14, 작을수록 확대), RN 은 delta(작을수록 확대)로 배율을 다룬다.
export const DEFAULT_DELTA = 0.02;

export function levelToDelta(level: number): number {
  return DEFAULT_DELTA * 2 ** (level - 3);
}

export function deltaToZoom(delta: number): number {
  return Math.round(Math.log2(360 / delta));
}

// 마커가 하나이거나 한곳에 몰려 있으면 범위의 넓이가 0에 가까워, 화면에 맞추라고
// 하면 최대 배율까지 당겨져 주변 지형이 사라진다. 도시가 보이는 정도를 최소로 둔다.
const MIN_VIEWPORT_BOUNDS_KM = 10;
// 위도 1도는 약 111km 다. 세로 기준으로 환산하고 경도에도 같은 degree 를 쓴다 —
// 위도 37° 에서 가로가 약 20% 좁지만, 넓은 쪽에 맞추고 패딩도 있어 배율에는 드러나지 않는다.
const KM_PER_DEGREE = 111;
export const MIN_FIT_SPAN = MIN_VIEWPORT_BOUNDS_KM / KM_PER_DEGREE;

interface FitBounds {
  ne: [number, number];
  sw: [number, number];
}

/** 좌표들을 감싸는 범위. 너무 좁으면 중심을 유지한 채 최소 범위까지 넓힌다. */
export function toFitBounds(coordinates: Coordinate[]): FitBounds | null {
  if (coordinates.length === 0) return null;

  const lats = coordinates.map((coordinate) => coordinate.lat);
  const lngs = coordinates.map((coordinate) => coordinate.lng);

  const [minLat, maxLat] = widenToMinSpan(Math.min(...lats), Math.max(...lats));
  const [minLng, maxLng] = widenToMinSpan(Math.min(...lngs), Math.max(...lngs));

  return { ne: [maxLng, maxLat], sw: [minLng, minLat] };
}

function widenToMinSpan(min: number, max: number): [number, number] {
  if (max - min >= MIN_FIT_SPAN) return [min, max];

  const center = (min + max) / 2;
  return [center - MIN_FIT_SPAN / 2, center + MIN_FIT_SPAN / 2];
}
