import type { Coordinate } from "@waylog/domains/utils";
import { calcDistance } from "~shared/utils/geo";

export function getDistanceMeters(from: Coordinate, to: Coordinate): number {
  return calcDistance(from, to);
}
