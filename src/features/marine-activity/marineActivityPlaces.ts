import { calcDistance } from "~shared/utils/geo";
import {
  MarineActivityType,
  type MarineActivityCoordinate,
  type MarineActivityType as MarineActivityTypeValue,
} from "./marineActivity.types";

export interface MarineActivityProviderPlace {
  activityType: MarineActivityTypeValue;
  placeCode: string;
  placeName: string;
  coordinate: MarineActivityCoordinate;
  maxDistanceMeters: number;
}

const beachMaxDistanceMeters = 50_000;
const skinScubaMaxDistanceMeters = 80_000;

const marineActivityProviderPlaces = [
  {
    activityType: MarineActivityType.Beach,
    placeCode: "HS2",
    placeName: "해운대해수욕장",
    coordinate: { lat: 35.1587, lng: 129.1604 },
    maxDistanceMeters: beachMaxDistanceMeters,
  },
  {
    activityType: MarineActivityType.Beach,
    placeCode: "JJ1",
    placeName: "중문색달해수욕장",
    coordinate: { lat: 33.2451, lng: 126.4099 },
    maxDistanceMeters: beachMaxDistanceMeters,
  },
  {
    activityType: MarineActivityType.Beach,
    placeCode: "GS1",
    placeName: "경포해수욕장",
    coordinate: { lat: 37.7995, lng: 128.9098 },
    maxDistanceMeters: beachMaxDistanceMeters,
  },
  {
    activityType: MarineActivityType.SkinScuba,
    placeCode: "BSSW",
    placeName: "문섬",
    coordinate: { lat: 33.2268, lng: 126.5831 },
    maxDistanceMeters: skinScubaMaxDistanceMeters,
  },
  {
    activityType: MarineActivityType.SkinScuba,
    placeCode: "BSBS",
    placeName: "광안리 인근 포인트",
    coordinate: { lat: 35.1532, lng: 129.1186 },
    maxDistanceMeters: skinScubaMaxDistanceMeters,
  },
] satisfies ReadonlyArray<MarineActivityProviderPlace>;

export function getDistanceMeters(
  from: MarineActivityCoordinate,
  to: MarineActivityCoordinate,
): number {
  return calcDistance(from, to);
}

export function getNearestMarineActivityPlace(
  activityType: MarineActivityTypeValue,
  coordinate: MarineActivityCoordinate,
): MarineActivityProviderPlace | null {
  const matchedPlaces = marineActivityProviderPlaces
    .filter((place) => place.activityType === activityType)
    .map((place) => ({ place, distanceMeters: getDistanceMeters(coordinate, place.coordinate) }))
    .filter(({ place, distanceMeters }) => distanceMeters <= place.maxDistanceMeters)
    .toSorted((left, right) => {
      const roundedDistanceDiff =
        Math.round(left.distanceMeters) - Math.round(right.distanceMeters);
      if (roundedDistanceDiff !== 0) return roundedDistanceDiff;
      return left.place.placeCode.localeCompare(right.place.placeCode);
    });

  return matchedPlaces[0]?.place ?? null;
}

export function getSupportedMarineActivityTypes(
  coordinate: MarineActivityCoordinate,
): MarineActivityTypeValue[] {
  const supportedTypes = Object.values(MarineActivityType).filter((activityType) => {
    return getNearestMarineActivityPlace(activityType, coordinate) != null;
  });

  return supportedTypes.toSorted((left, right) => {
    if (left === right) return 0;
    if (left === MarineActivityType.Beach) return -1;
    return 1;
  });
}
