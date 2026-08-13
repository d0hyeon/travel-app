import { calcDistance } from "~shared/utils/geo";
import type { MarineActivityCoordinate } from "./marineActivity.types";

export function getDistanceMeters(
  from: MarineActivityCoordinate,
  to: MarineActivityCoordinate,
): number {
  return calcDistance(from, to);
}
