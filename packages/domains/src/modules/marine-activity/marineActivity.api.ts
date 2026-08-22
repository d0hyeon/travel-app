import { differenceInCalendarDays, format, parseISO, set } from "date-fns";
import { governmentApi, type GovernmentApiResponse } from "../../client";
import {
  MarineActivityGrade,
  MarineActivityType,
  type DailyMarineActivityIndices,
  type MarineActivityGrade as MarineActivityGradeValue,
  type MarineActivityIndex,
  type MarineActivityMarkerItem,
  type MarineActivityType as MarineActivityTypeValue,
} from "./marineActivity.types";
import { getDistanceMeters } from "./marineActivityPlaces";
import type { Coordinate } from "../utils";

const marineActivityEndpoint = {
  [MarineActivityType.Beach]: "/1192136/fcstBeachv2/GetFcstBeachApiServicev2",
  [MarineActivityType.SkinScuba]:
    "/1192136/fcstSkinScubav2/GetFcstSkinScubaApiServicev2",
} as const;

type MarineActivityRawItem = Record<string, unknown>;

type MarineActivityResponseBody = {
  item?: MarineActivityRawItem | MarineActivityRawItem[];
  items?:
    | {
        item?: MarineActivityRawItem | MarineActivityRawItem[];
      }
    | MarineActivityRawItem[];
};

type MarineActivityApiEnvelope =
  | GovernmentApiResponse<MarineActivityResponseBody>
  | {
      header: { resultCode: string; resultMsg: string };
      body: MarineActivityResponseBody;
    };

interface GetMarineActivityIndicesParams {
  activityType: MarineActivityTypeValue;
  coordinate: Coordinate;
  date: string;
}

interface GetDailyMarineActivityIndicesParams {
  coordinate: Coordinate;
  date: string;
}

const marineActivitySearchRadiusMeters = 120_000;
const marineActivityPageSize = 300;
const predictedTimePriority = {
  오후: 3,
  오전: 2,
  일: 1,
} as const;

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

export async function getMarineActivityIndices({
  activityType,
  coordinate,
  date,
}: GetMarineActivityIndicesParams): Promise<MarineActivityIndex[]> {
  const responseEnvelope = await governmentApi.get<MarineActivityApiEnvelope>(
    marineActivityEndpoint[activityType],
    {
      params: {
        type: "json",
        reqDate: toMarineActivityRequestDate(date),
        numOfRows: marineActivityPageSize,
      },
    },
  );

  const response = unwrapMarineActivityResponse(responseEnvelope);

  if (response.header.resultCode !== "00") {
    throw new Error(response.header.resultMsg);
  }

  const rawItems = toMarineActivityItems(response.body);
  const normalizedRawItems = getSelectedDateMarineActivityItems(rawItems, date);

  const parsedMarineActivityIndices = normalizedRawItems
    .flatMap((rawItem) => {
      try {
        return [
          toMarineActivityIndex({
            rawItem,
            activityType,
            date,
            tripCoordinate: coordinate,
          }),
        ];
      } catch {
        return [];
      }
    })
    .toSorted((left, right) => left.distanceMeters - right.distanceMeters);

  const marineActivityIndices = parsedMarineActivityIndices
    .filter(
      (marineActivityIndex) =>
        marineActivityIndex.distanceMeters <= marineActivitySearchRadiusMeters,
    )
    .toSorted((left, right) => left.distanceMeters - right.distanceMeters);

  return marineActivityIndices;
}

export async function getDailyMarineActivityIndices({
  coordinate,
  date,
}: GetDailyMarineActivityIndicesParams): Promise<DailyMarineActivityIndices> {
  const settledIndices = await Promise.allSettled(
    Object.values(MarineActivityType).map((activityType) =>
      getMarineActivityIndices({ activityType, coordinate, date }),
    ),
  );

  const indices = settledIndices.flatMap((result) => {
    if (result.status !== "fulfilled") return [];
    return result.value;
  });

  return {
    date,
    coordinate,
    indices,
  };
}

export function getMarineActivityMarkerItems(
  dailyIndices: DailyMarineActivityIndices,
): MarineActivityMarkerItem[] {
  const markerItemByPlaceCode = dailyIndices.indices.reduce(
    (markerItems, index) => {
      const existingMarkerItem = markerItems.get(index.placeCode);

      if (!existingMarkerItem) {
        markerItems.set(index.placeCode, {
          placeCode: index.placeCode,
          placeName: index.placeName,
          coordinate: index.coordinate,
          indices: [index],
        });
        return markerItems;
      }

      markerItems.set(index.placeCode, {
        ...existingMarkerItem,
        indices: [...existingMarkerItem.indices, index].toSorted(
          (left, right) => {
            if (left.type === right.type) return 0;
            if (left.type === MarineActivityType.Beach) return -1;
            return 1;
          },
        ),
      });
      return markerItems;
    },
    new Map<string, MarineActivityMarkerItem>(),
  );

  return Array.from(markerItemByPlaceCode.values()).toSorted((left, right) => {
    return left.placeCode.localeCompare(right.placeCode);
  });
}

function toMarineActivityItems(
  responseBody: MarineActivityResponseBody,
): MarineActivityRawItem[] {
  if (Array.isArray(responseBody.items)) {
    return responseBody.items;
  }

  if (responseBody.items?.item) {
    return Array.isArray(responseBody.items.item)
      ? responseBody.items.item
      : [responseBody.items.item];
  }

  if (responseBody.item) {
    return Array.isArray(responseBody.item)
      ? responseBody.item
      : [responseBody.item];
  }

  return [];
}

function unwrapMarineActivityResponse(
  responseEnvelope: MarineActivityApiEnvelope,
): {
  header: { resultCode: string; resultMsg: string };
  body: MarineActivityResponseBody;
} {
  if ("response" in responseEnvelope) {
    return responseEnvelope.response;
  }

  return responseEnvelope;
}

function getSelectedDateMarineActivityItems(
  rawItems: MarineActivityRawItem[],
  date: string,
): MarineActivityRawItem[] {
  const selectedDateItems = rawItems.filter((rawItem) => {
    const predictedDate = readStringField(rawItem, ["predcYmd", "date"]);
    return predictedDate === date;
  });

  const groupedItems = selectedDateItems.reduce((itemMap, rawItem) => {
    const placeName =
      readStringField(rawItem, [
        "bbchNm",
        "skscExpcnRgnNm",
        "placeName",
        "name",
      ]) ?? "알 수 없는 지점";
    const latitude = readNumberField(rawItem, ["lat", "latitude", "la"]);
    const longitude = readNumberField(rawItem, [
      "lot",
      "lon",
      "lng",
      "longitude",
      "lo",
    ]);
    const placeKey = `${placeName}:${latitude ?? "unknown"}:${longitude ?? "unknown"}`;
    const existingItem = itemMap.get(placeKey);

    if (!existingItem) {
      itemMap.set(placeKey, rawItem);
      return itemMap;
    }

    const shouldReplace =
      getPredictedTimePriority(rawItem) >
      getPredictedTimePriority(existingItem);
    if (shouldReplace) {
      itemMap.set(placeKey, rawItem);
    }

    return itemMap;
  }, new Map<string, MarineActivityRawItem>());

  return Array.from(groupedItems.values());
}

function getPredictedTimePriority(rawItem: MarineActivityRawItem) {
  const predictedTime = readStringField(rawItem, ["predcNoonSeCd"]);
  if (!predictedTime) return 0;
  return (
    predictedTimePriority[
      predictedTime as keyof typeof predictedTimePriority
    ] ?? 0
  );
}

function toMarineActivityIndex({
  rawItem,
  activityType,
  date,
  tripCoordinate,
}: {
  rawItem: MarineActivityRawItem;
  activityType: MarineActivityTypeValue;
  date: string;
  tripCoordinate: Coordinate;
}): MarineActivityIndex {
  const score = readNumberField(rawItem, [
    "score",
    "beachScore",
    "skinScubaScore",
    "scoreCn",
  ]);
  const gradeLabel =
    readStringField(rawItem, [
      "gradeLabel",
      "beachIndex",
      "skinScubaIndex",
      "grade",
      "grdCn",
      "totalIndex",
    ]) ?? "정보 없음";
  const placeName =
    readStringField(rawItem, [
      "placeName",
      "beachName",
      "skinScubaName",
      "poiNm",
      "name",
      "bbchNm",
      "skscExpcnRgnNm",
    ]) ?? "알 수 없는 지점";
  const placeCode =
    readStringField(rawItem, [
      "placeCode",
      "beachCode",
      "skinScubaCode",
      "poiCode",
      "code",
    ]) ?? placeName;
  const coordinate = readMarineActivityCoordinate(rawItem);
  const distanceMeters = getDistanceMeters(tripCoordinate, coordinate);

  return {
    type: activityType,
    date,
    placeCode,
    placeName,
    coordinate,
    distanceMeters,
    grade: toMarineActivityGrade(
      gradeLabel !== "정보 없음" ? gradeLabel : score,
    ),
    gradeLabel,
    score,
    observedAt:
      readStringField(rawItem, [
        "observedAt",
        "baseTime",
        "obsrTime",
        "time",
        "tm",
        "predcYmd",
        "predcNoonSeCd",
      ]) ?? null,
    metrics: {
      waterTemperatureCelsius: readNumberField(rawItem, [
        "waterTemperature",
        "waterTemp",
        "tw",
        "wtmp",
        "avgWtem",
        "maxWtem",
        "minWtem",
      ]),
      waveHeightMeters: readNumberField(rawItem, [
        "waveHeight",
        "waveHeightMeters",
        "wh",
        "wvHt",
        "maxWvhgt",
        "minWvhgt",
      ]),
      windSpeedMetersPerSecond: readNumberField(rawItem, [
        "windSpeed",
        "windSpeedMetersPerSecond",
        "ws",
        "windSpd",
        "maxWspd",
      ]),
      airTemperatureCelsius: readNumberField(rawItem, [
        "airTemperature",
        "airTemp",
        "ta",
        "airTmp",
        "avgArtmp",
      ]),
      currentSpeedMetersPerSecond: readNumberField(rawItem, [
        "currentSpeed",
        "currentSpeedMetersPerSecond",
        "cs",
        "crrtSpd",
        "maxCrsp",
        "minCrsp",
      ]),
      tideLabel: readStringField(rawItem, [
        "tideLabel",
        "tide",
        "tdlvHrCn",
        "tideNm",
      ]),
    },
  };
}

function readMarineActivityCoordinate(
  rawItem: MarineActivityRawItem,
): Coordinate {
  const latitude = readNumberField(rawItem, ["lat", "latitude", "la"]);
  const longitude = readNumberField(rawItem, [
    "lon",
    "lng",
    "longitude",
    "lo",
    "lot",
  ]);

  if (latitude == null || longitude == null) {
    throw new Error("Marine activity response is missing coordinates");
  }

  return { lat: latitude, lng: longitude };
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
