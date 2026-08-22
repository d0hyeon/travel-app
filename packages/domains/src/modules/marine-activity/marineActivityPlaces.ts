import type { Coordinate } from "../../utils";
import { calcDistance } from "../../utils";

export function getDistanceMeters(from: Coordinate, to: Coordinate): number {
  return calcDistance(from, to);
}
