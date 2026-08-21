import { governmentApi, type GovernmentApiResponse } from "@waylog/domains/api";
import type { Coordinate } from "@waylog/domains/utils";
import type { ValueOf } from "@waylog/domains/utils";
import {
  type DailyWeatherForecast,
  type HourlyWeatherForecast,
  PrecipitationType,
  SkyCondition,
} from "./weather.types";
import { differenceInCalendarDays, parseISO, set } from "date-fns";
import { isOverseasByCoordinate } from "@waylog/domains/utils";

type GetDailyWeatherForecastParams = {
  /**
   * YYYYMMDD 또는 YYYY-MM-DD
   */
  date: string;
  coordinate: Coordinate;
  /**
   * 테스트에서 현재 시각을 고정할 수 있도록 주입 가능하게 한다.
   */
};

/**
 * ─────────────────────────────────────────────
 * KMA response types
 * ─────────────────────────────────────────────
 */

const WeatherErrorCode = {
  날짜검색범위_초과: "10",
} as const;

type WeatherErrorCode = ValueOf<typeof WeatherErrorCode>;

/**
 * 초단기예보 category
 */
const UltraShortForecastCategory = {
  낙뢰: "LGT",
  강수형태: "PTY",
  한시간강수량: "RN1",
  하늘상태: "SKY",
  기온: "T1H",
  습도: "REH",
  동서바람성분: "UUU",
  남북바람성분: "VVV",
  풍향각도: "VEC",
  풍속: "WSD",
  강수확률: "POP",
} as const;

type UltraShortForecastCategory = ValueOf<typeof UltraShortForecastCategory>;

/**
 * 단기예보 category
 *
 * 단기예보에서는 기온이 T1H가 아니라 TMP이고,
 * 강수량도 RN1이 아니라 PCP이다.
 */
const ShortTermForecastCategory = {
  한시간기온: "TMP",
  일최저기온: "TMN",
  일최고기온: "TMX",

  강수형태: "PTY",
  한시간강수량: "PCP",
  강수확률: "POP",

  하늘상태: "SKY",
  습도: "REH",

  풍향각도: "VEC",
  풍속: "WSD",
} as const;

type ShortTermForecastCategory = ValueOf<typeof ShortTermForecastCategory>;

type ForecastItem<Category extends string> = {
  baseDate: string;
  baseTime: string;

  category: Category;

  fcstDate: string;
  fcstTime: string;
  fcstValue: string;

  nx: number;
  ny: number;
};

type ForecastResponseBody<Category extends string> = {
  items: {
    item: ForecastItem<Category>[];
  };
  pageNo: number;
  numOfRows: number;
  totalCount: number;
};

/**
 * ─────────────────────────────────────────────
 * Public service
 * ─────────────────────────────────────────────
 */
const 최대_예보일 = 3;
export function getIsWeatherForecastAvailability(date: string) {
  const daysFromToday = differenceInCalendarDays(
    parseISO(date),
    set(Date.now(), { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 }),
  );
  const isWithinForecastRange =
    daysFromToday >= 0 && daysFromToday < 최대_예보일;

  return isWithinForecastRange;
}

export async function getDailyWeatherForecast({
  date,
  coordinate,
}: GetDailyWeatherForecastParams): Promise<DailyWeatherForecast> {
  const now = new Date();
  const targetDate = normalizeDate(date);
  const today = formatLocalDate(now);

  const shortTermItems = await getShortTermForecastItems({
    coordinate,
    now,
  });

  const shortTermHourly = mapShortTermForecastItems(shortTermItems).filter(
    (item) => getDatePart(item.forecastAt) === targetDate,
  );

  if (targetDate !== today) {
    return createDailyWeatherForecast({
      date: targetDate,
      hourly: shortTermHourly,
      shortTermItems,
    });
  }

  const ultraShortItems = await getUltraShortForecastItems({
    coordinate,
    now,
  });

  const ultraShortHourly = mapUltraShortForecastItems(ultraShortItems).filter(
    (item) => getDatePart(item.forecastAt) === targetDate,
  );

  /**
   * 단기예보를 기본 데이터로 사용하고,
   * 동일한 forecastAt에는 초단기예보를 우선한다.
   */
  const mergedHourly = mergeHourlyForecasts({
    shortTerm: shortTermHourly,
    ultraShort: ultraShortHourly,
  });

  return createDailyWeatherForecast({
    date: targetDate,
    hourly: mergedHourly,
    shortTermItems,
  });
}

export default {
  getDailyForecast: getDailyWeatherForecast,
  getIsAvailability: getIsWeatherForecastAvailability,
  provider: "공공 데이터 포털",
};

/**
 * ─────────────────────────────────────────────
 * KMA API adapters
 * ─────────────────────────────────────────────
 */

async function getUltraShortForecastItems({
  coordinate,
  now,
}: {
  coordinate: Coordinate;
  now: Date;
}) {
  const grid = convertLatLonToKmaGrid(coordinate.lat, coordinate.lng);

  /**
   * 최신 발표분이 아직 제공되지 않는 경우를 고려해서
   * 현재 계산 결과 → 한 시간 전 발표분 순서로 재시도한다.
   */
  const baseCandidates = getUltraShortBaseDateTimeCandidates(now);

  let lastError: unknown;

  for (const base of baseCandidates) {
    try {
      const { response } = await governmentApi.get<
        GovernmentApiResponse<
          ForecastResponseBody<UltraShortForecastCategory>,
          WeatherErrorCode
        >
      >(getUltraShortForecastItems.PATH, {
        params: {
          pageNo: 1,
          numOfRows: 1000,
          dataType: "JSON",
          base_date: base.baseDate,
          base_time: base.baseTime,
          ...grid,
        },
      });

      if (response.header.resultCode !== "00") {
        lastError = response.header;
        continue;
      }

      const items = response.body.items?.item ?? [];

      if (items.length > 0) {
        return items;
      }
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError ?? new Error("초단기예보 데이터를 조회하지 못했습니다.");
}

getUltraShortForecastItems.PATH =
  "/1360000/VilageFcstInfoService_2.0/getUltraSrtFcst";

async function getShortTermForecastItems({
  coordinate,
  now,
}: {
  coordinate: Coordinate;
  now: Date;
}) {
  const grid = convertLatLonToKmaGrid(coordinate.lat, coordinate.lng);

  const baseCandidates = getShortTermBaseDateTimeCandidates(now);

  let lastError: unknown;

  for (const base of baseCandidates) {
    try {
      const { response } = await governmentApi.get<
        GovernmentApiResponse<
          ForecastResponseBody<ShortTermForecastCategory>,
          WeatherErrorCode
        >
      >(getShortTermForecastItems.PATH, {
        params: {
          pageNo: 1,
          /**
           * 단기예보는 여러 날짜와 카테고리가 내려오므로
           * 100보다 넉넉하게 잡는다.
           */
          numOfRows: 2000,
          dataType: "JSON",
          base_date: base.baseDate,
          base_time: base.baseTime,
          ...grid,
        },
      });

      if (response.header.resultCode !== "00") {
        lastError = response.header;
        continue;
      }

      const items = response.body.items?.item ?? [];

      if (items.length > 0) {
        return items;
      }
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError ?? new Error("단기예보 데이터를 조회하지 못했습니다.");
}

getShortTermForecastItems.PATH =
  "/1360000/VilageFcstInfoService_2.0/getVilageFcst";

/**
 * ─────────────────────────────────────────────
 * Raw forecast → hourly domain model
 * ─────────────────────────────────────────────
 */

type GroupedForecastValues<Category extends string> = Partial<
  Record<Category, string>
>;

type GroupedForecast<Category extends string> = {
  forecastDate: string;
  forecastTime: string;
  values: GroupedForecastValues<Category>;
};

function groupForecastItemsByDateTime<Category extends string>(
  items: ForecastItem<Category>[],
): GroupedForecast<Category>[] {
  const grouped = new Map<string, GroupedForecast<Category>>();

  for (const item of items) {
    const key = `${item.fcstDate}:${item.fcstTime}`;

    const forecast = grouped.get(key) ?? {
      forecastDate: item.fcstDate,
      forecastTime: item.fcstTime,
      values: {} as Partial<Record<Category, string>>,
    };

    forecast.values[item.category] = item.fcstValue;

    grouped.set(key, forecast);
  }

  return [...grouped.values()].sort((a, b) => {
    const aKey = `${a.forecastDate}${a.forecastTime}`;
    const bKey = `${b.forecastDate}${b.forecastTime}`;

    return aKey.localeCompare(bKey);
  });
}

function mapUltraShortForecastItems(
  items: ForecastItem<UltraShortForecastCategory>[],
): HourlyWeatherForecast[] {
  return groupForecastItemsByDateTime(items).map(
    ({ forecastDate, forecastTime, values }) => ({
      forecastAt: toKoreaIsoDateTime(forecastDate, forecastTime),

      temperature: parseOptionalNumber(values[UltraShortForecastCategory.기온]),

      humidity: parseOptionalNumber(values[UltraShortForecastCategory.습도]),

      skyCondition: parseSkyCondition(
        values[UltraShortForecastCategory.하늘상태],
      ),

      precipitationType: parsePrecipitationType(
        values[UltraShortForecastCategory.강수형태],
      ),

      precipitationProbability: parseOptionalNumber(
        values[UltraShortForecastCategory.강수확률],
      ),

      precipitationAmount: normalizePrecipitationAmount(
        values[UltraShortForecastCategory.한시간강수량],
      ),

      windDirection: parseOptionalNumber(
        values[UltraShortForecastCategory.풍향각도],
      ),

      windSpeed: parseOptionalNumber(values[UltraShortForecastCategory.풍속]),

      source: "ultraShort",
    }),
  );
}

function mapShortTermForecastItems(
  items: ForecastItem<ShortTermForecastCategory>[],
): HourlyWeatherForecast[] {
  return (
    groupForecastItemsByDateTime(items)
      /**
       * TMN/TMX처럼 특정 시각에만 들어오는 일 단위 값 때문에
       * 기상값이 없는 빈 시간대 객체가 생길 수 있다.
       *
       * Hourly 데이터는 TMP/SKY/PTY 등 실제 시간대 정보가 있는
       * 항목만 남긴다.
       */
      .filter(({ values }) =>
        hasAnyValue(values, [
          ShortTermForecastCategory.한시간기온,
          ShortTermForecastCategory.하늘상태,
          ShortTermForecastCategory.강수형태,
          ShortTermForecastCategory.강수확률,
          ShortTermForecastCategory.풍속,
        ]),
      )
      .map(({ forecastDate, forecastTime, values }) => ({
        forecastAt: toKoreaIsoDateTime(forecastDate, forecastTime),

        temperature: parseOptionalNumber(
          values[ShortTermForecastCategory.한시간기온],
        ),

        humidity: parseOptionalNumber(values[ShortTermForecastCategory.습도]),

        skyCondition: parseSkyCondition(
          values[ShortTermForecastCategory.하늘상태],
        ),

        precipitationType: parsePrecipitationType(
          values[ShortTermForecastCategory.강수형태],
        ),

        precipitationProbability: parseOptionalNumber(
          values[ShortTermForecastCategory.강수확률],
        ),

        precipitationAmount: normalizePrecipitationAmount(
          values[ShortTermForecastCategory.한시간강수량],
        ),

        windDirection: parseOptionalNumber(
          values[ShortTermForecastCategory.풍향각도],
        ),

        windSpeed: parseOptionalNumber(values[ShortTermForecastCategory.풍속]),

        source: "shortTerm",
      }))
  );
}

/**
 * ─────────────────────────────────────────────
 * Merge
 * ─────────────────────────────────────────────
 */

function mergeHourlyForecasts({
  shortTerm,
  ultraShort,
}: {
  shortTerm: HourlyWeatherForecast[];
  ultraShort: HourlyWeatherForecast[];
}) {
  const forecastByTime = new Map<string, HourlyWeatherForecast>();

  for (const item of shortTerm) {
    forecastByTime.set(item.forecastAt, item);
  }

  /**
   * 나중에 set하므로 같은 시각은 초단기예보로 교체된다.
   */
  for (const item of ultraShort) {
    forecastByTime.set(item.forecastAt, item);
  }

  return [...forecastByTime.values()].sort((a, b) =>
    a.forecastAt.localeCompare(b.forecastAt),
  );
}

/**
 * ─────────────────────────────────────────────
 * Daily summary
 * ─────────────────────────────────────────────
 */

function createDailyWeatherForecast({
  date,
  hourly,
  shortTermItems,
}: {
  date: string;
  hourly: HourlyWeatherForecast[];
  shortTermItems: ForecastItem<ShortTermForecastCategory>[];
}): DailyWeatherForecast {
  if (hourly.length === 0) {
    throw new Error(`${date} 날짜의 예보 데이터가 없습니다.`);
  }

  const dailyTemperature = getDailyTemperatureRange({
    date,
    hourly,
    shortTermItems,
  });

  const amHourly = hourly.filter(
    ({ forecastAt }) => getForecastHour(forecastAt) < 12,
  );

  const pmHourly = hourly.filter(
    ({ forecastAt }) => getForecastHour(forecastAt) >= 12,
  );

  return {
    date,

    summary: {
      skyCondition: getRepresentativeSkyCondition(hourly),

      precipitationType: getRepresentativePrecipitationType(hourly),

      precipitationProbability: getMaximumNullable(
        hourly.map(({ precipitationProbability }) => precipitationProbability),
      ),

      minimumTemperature: dailyTemperature.minimum,

      maximumTemperature: dailyTemperature.maximum,
    },

    periods: {
      am: createWeatherSummary(amHourly),
      pm: createWeatherSummary(pmHourly),
    },

    hourly,
  };
}
function getForecastHour(forecastAt: string): number {
  const hour = Number(forecastAt.slice(11, 13));

  if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
    throw new Error(`잘못된 예보 시각입니다: ${forecastAt}`);
  }

  return hour;
}
function createWeatherSummary(
  hourly: HourlyWeatherForecast[],
): DailyWeatherForecast["summary"] {
  const temperatures = hourly
    .map(({ temperature }) => temperature)
    .filter(isNumber);

  const precipitationProbabilities = hourly
    .map(({ precipitationProbability }) => precipitationProbability)
    .filter(isNumber);

  return {
    skyCondition: getRepresentativeSkyCondition(hourly),

    precipitationType: getRepresentativePrecipitationType(hourly),

    precipitationProbability: getMaximum(precipitationProbabilities),

    minimumTemperature: getMinimum(temperatures),

    maximumTemperature: getMaximum(temperatures),
  };
}

function getDailyTemperatureRange({
  date,
  hourly,
  shortTermItems,
}: {
  date: string;
  hourly: HourlyWeatherForecast[];
  shortTermItems: ForecastItem<ShortTermForecastCategory>[];
}) {
  const dailyItems = shortTermItems.filter(
    (item) => normalizeDate(item.fcstDate) === date,
  );

  const reportedMinimum = findCategoryNumber(
    dailyItems,
    ShortTermForecastCategory.일최저기온,
  );

  const reportedMaximum = findCategoryNumber(
    dailyItems,
    ShortTermForecastCategory.일최고기온,
  );

  const hourlyTemperatures = hourly
    .map((item) => item.temperature)
    .filter(isNumber);

  return {
    minimum: reportedMinimum ?? getMinimum(hourlyTemperatures),

    maximum: reportedMaximum ?? getMaximum(hourlyTemperatures),
  };
}

function getRepresentativeSkyCondition(
  hourly: HourlyWeatherForecast[],
): SkyCondition | null {
  const counts = new Map<SkyCondition, number>();

  for (const { skyCondition } of hourly) {
    if (skyCondition == null) {
      continue;
    }

    counts.set(skyCondition, (counts.get(skyCondition) ?? 0) + 1);
  }

  const severity: Record<SkyCondition, number> = {
    [SkyCondition.맑음]: 1,
    [SkyCondition.구름많음]: 2,
    [SkyCondition.흐림]: 3,
  };

  const sorted = [...counts.entries()].sort(
    ([conditionA, countA], [conditionB, countB]) =>
      countB - countA || severity[conditionB] - severity[conditionA],
  );

  return sorted[0]?.[0] ?? null;
}

function getRepresentativePrecipitationType(
  hourly: HourlyWeatherForecast[],
): PrecipitationType {
  const severity: Record<PrecipitationType, number> = {
    [PrecipitationType.없음]: 0,
    [PrecipitationType.빗방울]: 1,
    [PrecipitationType.눈날림]: 1,
    [PrecipitationType.빗방울눈날림]: 2,
    [PrecipitationType.비]: 3,
    [PrecipitationType.눈]: 3,
    [PrecipitationType.비눈]: 4,
  };

  return hourly.reduce<PrecipitationType>(
    (selected, current) =>
      severity[current.precipitationType] > severity[selected]
        ? current.precipitationType
        : selected,
    PrecipitationType.없음,
  );
}

/**
 * ─────────────────────────────────────────────
 * Base date/time calculation
 * ─────────────────────────────────────────────
 */

type KmaBaseDateTime = {
  baseDate: string;
  baseTime: string;
};

/**
 * 초단기예보는 매시 30분 발표분을 사용한다.
 *
 * API 반영 지연을 감안해 현재 시각에서 15분을 빼고,
 * 가장 가까운 이전 HH30 발표 시각을 선택한다.
 */
function getUltraShortBaseDateTimeCandidates(now: Date): KmaBaseDateTime[] {
  const availableAt = addMinutes(now, -15);

  const latest = new Date(availableAt);

  if (latest.getMinutes() < 30) {
    latest.setHours(latest.getHours() - 1);
  }

  latest.setMinutes(30, 0, 0);

  return [toBaseDateTime(latest), toBaseDateTime(addHours(latest, -1))];
}

/**
 * 단기예보 기준 발표시각.
 */
const SHORT_TERM_BASE_HOURS = [2, 5, 8, 11, 14, 17, 20, 23] as const;

/**
 * 발표 직후 데이터가 아직 API에 반영되지 않은 경우를 고려해
 * 현재 시각에서 15분을 뺀 뒤 가장 최근 발표시각을 선택한다.
 *
 * 조회 실패 시 직전 발표분을 재시도하도록 후보 2개를 반환한다.
 */
function getShortTermBaseDateTimeCandidates(now: Date): KmaBaseDateTime[] {
  const availableAt = addMinutes(now, -15);
  const latest = findLatestShortTermBaseTime(availableAt);

  const previous = findLatestShortTermBaseTime(addMinutes(latest, -1));

  return [toBaseDateTime(latest), toBaseDateTime(previous)];
}

function findLatestShortTermBaseTime(date: Date): Date {
  const result = new Date(date);

  const availableHour = [...SHORT_TERM_BASE_HOURS]
    .reverse()
    .find((hour) => hour <= result.getHours());

  if (availableHour != null) {
    result.setHours(availableHour, 0, 0, 0);

    return result;
  }

  result.setDate(result.getDate() - 1);
  result.setHours(23, 0, 0, 0);

  return result;
}

function toBaseDateTime(date: Date): KmaBaseDateTime {
  return {
    baseDate: formatKmaDate(date),
    baseTime: `${pad2(date.getHours())}${pad2(date.getMinutes())}`,
  };
}

/**
 * ─────────────────────────────────────────────
 * Category parsers
 * ─────────────────────────────────────────────
 */

function parseSkyCondition(value: string | undefined): SkyCondition | null {
  switch (value) {
    case "1":
      return SkyCondition.맑음;

    case "3":
      return SkyCondition.구름많음;

    case "4":
      return SkyCondition.흐림;

    default:
      return null;
  }
}

function parsePrecipitationType(value: string | undefined): PrecipitationType {
  switch (value) {
    case "1":
      return PrecipitationType.비;

    case "2":
      return PrecipitationType.비눈;

    case "3":
      return PrecipitationType.눈;

    case "5":
      return PrecipitationType.빗방울;

    case "6":
      return PrecipitationType.빗방울눈날림;

    case "7":
      return PrecipitationType.눈날림;

    case "0":
    default:
      return PrecipitationType.없음;
  }
}

function normalizePrecipitationAmount(
  value: string | undefined,
): string | null {
  if (value == null || value.trim() === "") {
    return null;
  }

  return value;
}

function parseOptionalNumber(value: string | undefined): number | null {
  if (value == null || value.trim() === "") {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= -900) {
    return null;
  }

  return parsed;
}

/**
 * ─────────────────────────────────────────────
 * Utility
 * ─────────────────────────────────────────────
 */

function hasAnyValue<Category extends string>(
  values: GroupedForecastValues<Category>,
  categories: Category[],
) {
  return categories.some((category) => values[category] != null);
}

function findCategoryNumber<Category extends string>(
  items: ForecastItem<Category>[],
  category: Category,
): number | null {
  const item = items.find((candidate) => candidate.category === category);

  return parseOptionalNumber(item?.fcstValue);
}

function isNumber(value: number | null): value is number {
  return value != null;
}

function getMinimum(values: number[]): number | null {
  return values.length > 0 ? Math.min(...values) : null;
}

function getMaximum(values: number[]): number | null {
  return values.length > 0 ? Math.max(...values) : null;
}

function getMaximumNullable(values: Array<number | null>): number | null {
  return getMaximum(values.filter(isNumber));
}

function normalizeDate(value: string): string {
  if (/^\d{8}$/.test(value)) {
    return [value.slice(0, 4), value.slice(4, 6), value.slice(6, 8)].join("-");
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  throw new Error(`지원하지 않는 날짜 형식입니다: ${value}`);
}

function formatLocalDate(date: Date): string {
  return [
    date.getFullYear(),
    pad2(date.getMonth() + 1),
    pad2(date.getDate()),
  ].join("-");
}

function formatKmaDate(date: Date): string {
  return formatLocalDate(date).replaceAll("-", "");
}

function getDatePart(isoDateTime: string): string {
  return isoDateTime.slice(0, 10);
}

function toKoreaIsoDateTime(date: string, time: string): string {
  const normalizedDate = normalizeDate(date);

  const hours = time.slice(0, 2);
  const minutes = time.slice(2, 4);

  return `${normalizedDate}T${hours}:${minutes}:00+09:00`;
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 60 * 60_000);
}

/**
 * ─────────────────────────────────────────────
 * Grid coordinate conversion
 * ─────────────────────────────────────────────
 */

type GridCoordinate = {
  nx: number;
  ny: number;
};

export function convertLatLonToKmaGrid(
  latitude: number,
  longitude: number,
): GridCoordinate {
  const RE = 6371.00877;
  const GRID = 5.0;
  const SLAT1 = 30.0;
  const SLAT2 = 60.0;
  const OLON = 126.0;
  const OLAT = 38.0;
  const XO = 43;
  const YO = 136;

  const DEGRAD = Math.PI / 180;

  const re = RE / GRID;
  const slat1 = SLAT1 * DEGRAD;
  const slat2 = SLAT2 * DEGRAD;
  const olon = OLON * DEGRAD;
  const olat = OLAT * DEGRAD;

  let sn =
    Math.tan(Math.PI * 0.25 + slat2 * 0.5) /
    Math.tan(Math.PI * 0.25 + slat1 * 0.5);

  sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);

  let sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);

  sf = (Math.pow(sf, sn) * Math.cos(slat1)) / sn;

  let ro = Math.tan(Math.PI * 0.25 + olat * 0.5);

  ro = (re * sf) / Math.pow(ro, sn);

  let ra = Math.tan(Math.PI * 0.25 + latitude * DEGRAD * 0.5);

  ra = (re * sf) / Math.pow(ra, sn);

  let theta = longitude * DEGRAD - olon;

  if (theta > Math.PI) {
    theta -= 2 * Math.PI;
  }

  if (theta < -Math.PI) {
    theta += 2 * Math.PI;
  }

  theta *= sn;

  return {
    nx: Math.floor(ra * Math.sin(theta) + XO + 0.5),
    ny: Math.floor(ro - ra * Math.cos(theta) + YO + 0.5),
  };
}
