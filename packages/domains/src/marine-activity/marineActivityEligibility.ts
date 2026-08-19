import { isOverseasByCoordinate } from "../utils";
import {
  MarineActivityDisableReason,
  type MarineActivityEligibility,
} from "./marineActivity.types";
import { getCoordinateByLocation } from "@waylog/domains/location";
import type { Coordinate } from "@waylog/domains/utils";

const islandDestinationNames = [
  "제주",
  "우도",
  "가파도",
  "마라도",
  "울릉",
  "독도",
  "거제",
  "강화",
  "영종",
  "남해",
  "완도",
  "진도",
  "백령",
  "대청",
  "소청",
  "흑산",
  "홍도",
  "거문",
  "추자",
  "비금",
  "도초",
  "안면",
  "선유",
  "욕지",
  "사량",
  "매물",
] as const;

const koreanMarineActivityAreas = [
  { name: "jeju", minLat: 33.1, maxLat: 33.7, minLng: 126.1, maxLng: 127.1 },
  { name: "busan", minLat: 35.0, maxLat: 35.4, minLng: 128.9, maxLng: 129.4 },
  { name: "incheon", minLat: 37.2, maxLat: 37.8, minLng: 126.1, maxLng: 126.9 },
  {
    name: "gangwon-east",
    minLat: 37.0,
    maxLat: 38.6,
    minLng: 128.6,
    maxLng: 129.3,
  },
  {
    name: "south-jeolla-coast",
    minLat: 34.2,
    maxLat: 35.3,
    minLng: 126.0,
    maxLng: 127.9,
  },
  {
    name: "south-gyeongsang-coast",
    minLat: 34.5,
    maxLat: 35.4,
    minLng: 127.7,
    maxLng: 129.2,
  },
  {
    name: "north-gyeongsang-coast",
    minLat: 35.6,
    maxLat: 37.2,
    minLng: 128.8,
    maxLng: 129.7,
  },
  {
    name: "west-coast",
    minLat: 35.6,
    maxLat: 37.3,
    minLng: 125.9,
    maxLng: 126.9,
  },
] satisfies ReadonlyArray<{
  name: string;
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}>;

export function isIslandDestinationName(destinationName: string): boolean {
  const normalizedName = destinationName.replaceAll(/\s/g, "");
  return islandDestinationNames.some((keyword) =>
    normalizedName.includes(keyword),
  );
}

export function isCoordinateInMarineActivityArea(
  coordinate: Coordinate,
): boolean {
  return koreanMarineActivityAreas.some((area) => {
    const isWithinLatitude =
      coordinate.lat >= area.minLat && coordinate.lat <= area.maxLat;
    const isWithinLongitude =
      coordinate.lng >= area.minLng && coordinate.lng <= area.maxLng;
    return isWithinLatitude && isWithinLongitude;
  });
}

interface GetTripMarineActivityEligibilityParams {
  coordinate: Coordinate;
}

export function getTripMarineActivityEligibility({
  coordinate,
}: GetTripMarineActivityEligibilityParams): MarineActivityEligibility {
  if (isOverseasByCoordinate(coordinate)) {
    return {
      isEligible: false,
      reason: MarineActivityDisableReason.OverseasDestination,
    };
  }

  // const hasIslandDestination = destinations.some(isIslandDestinationName);
  // if (hasIslandDestination) {
  //   return { isEligible: true, reason: null };
  // }

  if (isCoordinateInMarineActivityArea(coordinate)) {
    return { isEligible: true, reason: null };
  }

  return {
    isEligible: false,
    reason: MarineActivityDisableReason.NotMarineDestination,
  };
}
