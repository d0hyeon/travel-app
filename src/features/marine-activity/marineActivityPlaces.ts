import type { Coordinate } from "~shared/types/coordinate";
import { calcDistance } from "~shared/utils/geo";

export function getDistanceMeters(from: Coordinate, to: Coordinate): number {
  return calcDistance(from, to);
}
