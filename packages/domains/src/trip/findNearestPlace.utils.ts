import type { Coordinate } from "@waylog/domains/utils";
import { calcDistance } from "@waylog/domains/utils";

interface FindNearestPlaceOptions {
  /** 이 거리(m)를 넘으면 가장 가까운 장소라도 고르지 않는다. */
  withinMeters?: number;
}

export function findNearestPlace<T extends Coordinate>(
  coordinate: Coordinate,
  places: T[],
  { withinMeters }: FindNearestPlaceOptions = {},
): T | null {
  if (places.length === 0) return null;

  const nearest = places.reduce((nearest, place) => (
    calcDistance(coordinate, place) < calcDistance(coordinate, nearest) ? place : nearest
  ));

  if (withinMeters != null && calcDistance(coordinate, nearest) > withinMeters) {
    return null;
  }

  return nearest;
}
