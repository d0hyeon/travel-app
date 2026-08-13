import { differenceInCalendarDays, format, parseISO, set } from "date-fns";
import { governmentApi, type GovernmentApiResponse } from "~api/governmentApi";
import { MarineActivityDisableReason, MarineActivityGrade, MarineActivityType, type DailyMarineActivityIndices, type MarineActivityCoordinate, type MarineActivityGrade as MarineActivityGradeValue, type MarineActivityIndex, type MarineActivityType as MarineActivityTypeValue } from "./marineActivity.types";
import { getNearestMarineActivityPlace, getSupportedMarineActivityTypes } from "./marineActivityPlaces";

const marineActivityEndpoint = {
  [MarineActivityType.Beach]: "/1192136/fcstBeachv2/GetFcstBeachApiServicev2",
  [MarineActivityType.SkinScuba]: "/1192136/fcstSkinScubav2/GetFcstSkinScubaApiServicev2",
} as const;

type MarineActivityRawItem = Record<string, unknown>;

type MarineActivityResponseBody = {
  items?: {
    item?: MarineActivityRawItem | MarineActivityRawItem[];
  };
};

interface GetMarineActivityIndexParams {
  activityType: MarineActivityTypeValue;
  coordinate: MarineActivityCoordinate;
  date: string;
}

interface GetDailyMarineActivityIndicesParams {
  coordinate: MarineActivityCoordinate;
  date: string;
}

export function getIsMarineActivityForecastAvailability(date: string) {
  const daysFromToday = differenceInCalendarDays(
    parseISO(date),
    set(Date.now(), { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 }),
  );
  return daysFromToday >= 0 && daysFromToday < 4;
}

export function toMarineActivityRequestDate(date: string) {
  return format(parseISO(date), "yyyyMMdd");
}

export function toMarineActivityGrade(
  labelOrScore: string | number | null | undefined,
): MarineActivityGradeValue {
  if (typeof labelOrScore === "number") {
    if (labelOrScore >= 80) return MarineActivityGrade.VeryGood;
    if (labelOrScore >= 60) return MarineActivityGrade.Good;
    if (labelOrScore >= 40) return MarineActivityGrade.Normal;
    if (labelOrScore >= 20) return MarineActivityGrade.Bad;
    return MarineActivityGrade.VeryBad;
  }

  if (typeof labelOrScore !== "string") {
    return MarineActivityGrade.Unknown;
  }

  const normalizedLabel = labelOrScore.toLowerCase();

  if (
    normalizedLabel.includes("매우 좋음") ||
    normalizedLabel.includes("최상") ||
    normalizedLabel.includes("very good")
  ) {
    return MarineActivityGrade.VeryGood;
  }
  if (normalizedLabel.includes("좋음") || normalizedLabel.includes("good")) {
    return MarineActivityGrade.Good;
  }
  if (normalizedLabel.includes("보통") || normalizedLabel.includes("normal")) {
    return MarineActivityGrade.Normal;
  }
  if (
    normalizedLabel.includes("매우 나쁨") ||
    normalizedLabel.includes("위험") ||
    normalizedLabel.includes("very bad")
  ) {
    return MarineActivityGrade.VeryBad;
  }
  if (normalizedLabel.includes("나쁨") || normalizedLabel.includes("bad")) {
    return MarineActivityGrade.Bad;
  }

  return MarineActivityGrade.Unknown;
}

export async function getMarineActivityIndex({
  activityType,
  coordinate,
  date,
}: GetMarineActivityIndexParams): Promise<MarineActivityIndex | null> {
  const providerPlace = getNearestMarineActivityPlace(activityType, coordinate);
  if (!providerPlace) return null;

  const { response } = await governmentApi.get<
    GovernmentApiResponse<MarineActivityResponseBody>
  >(marineActivityEndpoint[activityType], {
    params: {
      type: "json",
      reqDate: toMarineActivityRequestDate(date),
      placeCode: providerPlace.placeCode,
    },
  });

  if (response.header.resultCode !== "00") {
    throw new Error(response.header.resultMsg);
  }

  const rawItems = toMarineActivityItems(response.body.items?.item);
  const matchedItem = rawItems[0];
  if (!matchedItem) return null;

  return toMarineActivityIndex({
    rawItem: matchedItem,
    activityType,
    date,
    coordinate,
    placeCode: providerPlace.placeCode,
    defaultPlaceName: providerPlace.placeName,
  });
}

export async function getDailyMarineActivityIndices({
  coordinate,
  date,
}: GetDailyMarineActivityIndicesParams): Promise<DailyMarineActivityIndices> {
  const supportedTypes = getSupportedMarineActivityTypes(coordinate);

  const settledIndices = await Promise.allSettled(
    supportedTypes.map((activityType) =>
      getMarineActivityIndex({ activityType, coordinate, date }),
    ),
  );

  const indices = settledIndices.flatMap((result) => {
    if (result.status !== "fulfilled" || result.value == null) return [];
    return [result.value];
  });

  return {
    date,
    coordinate,
    indices,
  };
}

function toMarineActivityItems(
  rawItems: MarineActivityRawItem | MarineActivityRawItem[] | undefined,
): MarineActivityRawItem[] {
  if (!rawItems) return [];
  return Array.isArray(rawItems) ? rawItems : [rawItems];
}

function toMarineActivityIndex({
  rawItem,
  activityType,
  date,
  coordinate,
  placeCode,
  defaultPlaceName,
}: {
  rawItem: MarineActivityRawItem;
  activityType: MarineActivityTypeValue;
  date: string;
  coordinate: MarineActivityCoordinate;
  placeCode: string;
  defaultPlaceName: string;
}): MarineActivityIndex {
  const score = readNumberField(rawItem, ["score", "beachScore", "skinScubaScore", "scoreCn"]);
  const gradeLabel =
    readStringField(rawItem, [
      "gradeLabel",
      "beachIndex",
      "skinScubaIndex",
      "grade",
      "grdCn",
    ]) ?? "정보 없음";
  const placeName =
    readStringField(rawItem, ["placeName", "beachName", "skinScubaName", "poiNm", "name"]) ??
    defaultPlaceName;

  return {
    type: activityType,
    date,
    placeCode,
    placeName,
    distanceMeters: providerPlaceDistanceMeters(activityType, coordinate),
    grade: toMarineActivityGrade(gradeLabel !== "정보 없음" ? gradeLabel : score),
    gradeLabel,
    score,
    observedAt:
      readStringField(rawItem, ["observedAt", "baseTime", "obsrTime", "time", "tm"]) ?? null,
    metrics: {
      waterTemperatureCelsius: readNumberField(rawItem, ["waterTemperature", "waterTemp", "tw", "wtmp"]),
      waveHeightMeters: readNumberField(rawItem, ["waveHeight", "waveHeightMeters", "wh", "wvHt"]),
      windSpeedMetersPerSecond: readNumberField(rawItem, ["windSpeed", "windSpeedMetersPerSecond", "ws", "windSpd"]),
      airTemperatureCelsius: readNumberField(rawItem, ["airTemperature", "airTemp", "ta", "airTmp"]),
      currentSpeedMetersPerSecond: readNumberField(rawItem, ["currentSpeed", "currentSpeedMetersPerSecond", "cs", "crrtSpd"]),
      tideLabel: readStringField(rawItem, ["tideLabel", "tide", "tdlvHrCn", "tideNm"]),
    },
  };
}

function providerPlaceDistanceMeters(
  activityType: MarineActivityTypeValue,
  coordinate: MarineActivityCoordinate,
) {
  const providerPlace = getNearestMarineActivityPlace(activityType, coordinate);
  if (!providerPlace) return 0;
  return Math.round(
    Math.hypot(
      coordinate.lat - providerPlace.coordinate.lat,
      coordinate.lng - providerPlace.coordinate.lng,
    ) * 111_000,
  );
}

function readStringField(
  rawItem: MarineActivityRawItem,
  fieldNames: string[],
): string | null {
  const matchedValue = fieldNames
    .map((fieldName) => rawItem[fieldName])
    .find((value) => typeof value === "string" && value.length > 0);

  return typeof matchedValue === "string" ? matchedValue : null;
}

function readNumberField(
  rawItem: MarineActivityRawItem,
  fieldNames: string[],
): number | null {
  const matchedValue = fieldNames
    .map((fieldName) => rawItem[fieldName])
    .find((value) => value != null && value !== "");

  if (typeof matchedValue === "number") return matchedValue;
  if (typeof matchedValue === "string") {
    const parsedNumber = Number(matchedValue);
    return Number.isFinite(parsedNumber) ? parsedNumber : null;
  }
  return null;
}
