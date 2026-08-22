import type { Coordinate } from "../../utils";

export interface NormalizedPoint {
  x: number;
  y: number;
}

interface Bounds {
  minLng: number;
  maxLng: number;
  minLat: number;
  maxLat: number;
}

export function getCoordinateBounds(coords: Coordinate[]): Bounds {
  return {
    minLng: Math.min(...coords.map((c) => c.lng)),
    maxLng: Math.max(...coords.map((c) => c.lng)),
    minLat: Math.min(...coords.map((c) => c.lat)),
    maxLat: Math.max(...coords.map((c) => c.lat)),
  };
}

/** 좌표를 그림 영역 안의 점으로 옮긴다. 위도는 위아래가 뒤집힌다. */
export function normalizeCoordsToCanvas(
  coords: Coordinate[],
  bounds: Bounds,
  size: { width: number; height: number; padding: number },
): NormalizedPoint[] {
  const lngRange = bounds.maxLng - bounds.minLng || 1;
  const latRange = bounds.maxLat - bounds.minLat || 1;
  const innerWidth = size.width - size.padding * 2;
  const innerHeight = size.height - size.padding * 2;

  return coords.map(({ lat, lng }) => ({
    x: size.padding + ((lng - bounds.minLng) / lngRange) * innerWidth,
    y: size.padding + ((bounds.maxLat - lat) / latRange) * innerHeight,
  }));
}

export function pointsToPath(points: NormalizedPoint[]): string {
  if (points.length === 0) return "";
  return (
    points
      .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`)
      .join(" ") + " Z"
  );
}

const DOT_MIN_GAP = 7;

/** 너무 가까운 점은 겹쳐 보이므로 하나만 남긴다. */
export function dedupeNearbyPoints(points: NormalizedPoint[]): NormalizedPoint[] {
  return points.filter((point, index) =>
    points
      .slice(0, index)
      .every((prev) => Math.hypot(point.x - prev.x, point.y - prev.y) >= DOT_MIN_GAP),
  );
}
