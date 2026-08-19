import type { Coordinate } from "@waylog/domains/utils";
import { calcDistance } from "~shared/utils/geo";

export function findNearestPlace<T extends Coordinate>(coordinate: Coordinate, places: T[]): T | null {
  if (places.length === 0) return null;

  return places.reduce((nearest, place) => (
    calcDistance(coordinate, place) < calcDistance(coordinate, nearest) ? place : nearest
  ));
}
