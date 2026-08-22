import { differenceInCalendarDays, parseISO, set } from "date-fns";
import { createHttpClient } from "@waylog/domains/api";
import type { Coordinate } from "@waylog/utility";
import {
  PrecipitationType,
  SkyCondition,
  type DailyWeatherForecast,
  type HourlyWeatherForecast,
  type SummaryForecast,
} from "./weather.types";

const WEATHER_FORECASE_FIELDS = {
  HOURLY: [
    "temperature_2m",
    "relative_humidity_2m",
    "precipitation_probability",
    "precipitation",
    "rain",
    "snowfall",
    "weather_code",
    "wind_speed_10m",
    "wind_direction_10m",
  ],
  DAILY: [
    "weather_code",
    "temperature_2m_min",
    "temperature_2m_max",
    "precipitation_probability_max",
  ],
};

/**
 * 요청 타입
 */

type GetDailyWeatherForecastParams = {
  /** YYYY-MM-DD */
  date: string;
  coordinate: Coordinate;
};

/**
 * Open-Meteo 응답 타입
 */

type GetWeatherForecaseResponse = {
  latitude: number;
  longitude: number;
  timezone: string;
  timezone_abbreviation: string;
  utc_offset_seconds: number;

  hourly: {
    time: string[];
    temperature_2m: Array<number | null>;
    relative_humidity_2m: Array<number | null>;
    precipitation_probability: Array<number | null>;
    precipitation: Array<number | null>;
    rain: Array<number | null>;
    snowfall: Array<number | null>;
    weather_code: Array<number | null>;
    wind_speed_10m: Array<number | null>;
    wind_direction_10m: Array<number | null>;
  };

  daily: {
    time: string[];
    weather_code: Array<number | null>;
    temperature_2m_min: Array<number | null>;
    temperature_2m_max: Array<number | null>;
    precipitation_probability_max: Array<number | null>;
  };
};

/**
 * API
 */

const openMetroApi = createHttpClient({
  baseUrl: "https://api.open-meteo.com",
});

const 최대_예보일 = 14;

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
  const response = await openMetroApi.get<GetWeatherForecaseResponse>(
    getDailyWeatherForecast.PATH,
    {
      params: {
        latitude: coordinate.lat,
        longitude: coordinate.lng,
        start_date: date,
        end_date: date,
        timezone: "auto",
        temperature_unit: "celsius",
        wind_speed_unit: "ms",
        precipitation_unit: "mm",
        hourly: WEATHER_FORECASE_FIELDS.HOURLY.join(","),
        daily: WEATHER_FORECASE_FIELDS.DAILY.join(","),
      },
    },
  );

  return mapOpenMeteoForecast(response, date);
}
getDailyWeatherForecast.PATH = "/v1/forecast";

export default {
  getDailyForecast: getDailyWeatherForecast,
  getIsAvailability: getIsWeatherForecastAvailability,
  provider: "Open Metro",
};

/**
 * 응답 매핑
 */

function mapOpenMeteoForecast(
  data: GetWeatherForecaseResponse,
  date: string,
): DailyWeatherForecast {
  const hourly = data.hourly.time.map(
    (forecastAt, index): HourlyWeatherForecast => {
      const weatherCode = data.hourly.weather_code[index] ?? null;
      const rain = data.hourly.rain[index] ?? null;
      const snowfall = data.hourly.snowfall[index] ?? null;
      const precipitation = data.hourly.precipitation[index] ?? null;

      return {
        forecastAt,
        temperature: data.hourly.temperature_2m[index] ?? null,
        humidity: data.hourly.relative_humidity_2m[index] ?? null,
        skyCondition: mapWeatherCodeToSkyCondition(weatherCode),
        precipitationType: mapWeatherCodeToPrecipitationType({
          weatherCode,
          rain,
          snowfall,
        }),

        precipitationProbability:
          data.hourly.precipitation_probability[index] ?? null,
        precipitationAmount: formatPrecipitationAmount(precipitation),
        windDirection: data.hourly.wind_direction_10m[index] ?? null,
        windSpeed: data.hourly.wind_speed_10m[index] ?? null,
      };
    },
  );

  const dailyIndex = data.daily.time.indexOf(date);

  if (dailyIndex < 0) {
    throw new Error(`${date} 날짜의 일별 예보가 없습니다.`);
  }

  const dailyWeatherCode = data.daily.weather_code[dailyIndex] ?? null;
  const amHourly = hourly.filter(
    ({ forecastAt }) => getForecastHour(forecastAt) < 12,
  );

  const pmHourly = hourly.filter(
    ({ forecastAt }) => getForecastHour(forecastAt) >= 12,
  );

  return {
    date,
    summary: {
      skyCondition: mapWeatherCodeToSkyCondition(dailyWeatherCode),
      precipitationType: mapWeatherCodeToPrecipitationType({
        weatherCode: dailyWeatherCode,
      }),
      precipitationProbability:
        data.daily.precipitation_probability_max[dailyIndex] ?? null,
      minimumTemperature: data.daily.temperature_2m_min[dailyIndex] ?? null,
      maximumTemperature: data.daily.temperature_2m_max[dailyIndex] ?? null,
    },
    periods: {
      am: createWeatherSummary(amHourly),
      pm: createWeatherSummary(pmHourly),
    },
    hourly,
  };
}
function createWeatherSummary(hourly: HourlyWeatherForecast[]): SummaryForecast {
  const temperatures = getNonNullableValues(
    hourly.map(({ temperature }) => temperature),
  );

  const precipitationProbabilities = getNonNullableValues(
    hourly.map(({ precipitationProbability }) => precipitationProbability),
  );

  return {
    skyCondition: getRepresentativeSkyCondition(hourly),

    precipitationType: getRepresentativePrecipitationType(hourly),

    /**
     * 오전/오후 중 가장 높은 강수확률
     */
    precipitationProbability:
      precipitationProbabilities.length > 0
        ? Math.max(...precipitationProbabilities)
        : null,

    minimumTemperature:
      temperatures.length > 0 ? Math.min(...temperatures) : null,

    maximumTemperature:
      temperatures.length > 0 ? Math.max(...temperatures) : null,
  };
}

/**
 * 시간대 중 가장 자주 등장한 하늘 상태를 대표값으로 선택한다.
 *
 * 등장 횟수가 같으면 더 흐린 상태를 우선한다.
 */
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

  if (counts.size === 0) {
    return null;
  }

  const severity: Record<SkyCondition, number> = {
    [SkyCondition.맑음]: 1,
    [SkyCondition.구름많음]: 2,
    [SkyCondition.흐림]: 3,
  };

  const [representative] = [...counts.entries()].sort(
    ([conditionA, countA], [conditionB, countB]) =>
      countB - countA || severity[conditionB] - severity[conditionA],
  );

  return representative?.[0] ?? null;
}

/**
 * 시간대에 포함된 강수형태 중 우선순위가 가장 높은 값을 선택한다.
 */
function getRepresentativePrecipitationType(
  hourly: HourlyWeatherForecast[],
): PrecipitationType {
  const priority: Record<PrecipitationType, number> = {
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
      priority[current.precipitationType] > priority[selected]
        ? current.precipitationType
        : selected,
    PrecipitationType.없음,
  );
}

function getForecastHour(forecastAt: string): number {
  const hour = Number(forecastAt.slice(11, 13));

  if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
    throw new Error(`잘못된 예보 시각입니다: ${forecastAt}`);
  }

  return hour;
}

/**
 * WMO weather_code → 하늘 상태
 *
 * 0: 맑음
 * 1: 대체로 맑음
 * 2: 부분적으로 흐림
 * 3: 흐림
 * 그 외 강수·안개 현상은 화면상 흐림으로 처리
 */

function mapWeatherCodeToSkyCondition(
  weatherCode: number | null,
): SkyCondition | null {
  if (weatherCode == null) {
    return null;
  }

  switch (weatherCode) {
    case 0:
    case 1:
      return SkyCondition.맑음;

    case 2:
      return SkyCondition.구름많음;

    default:
      return SkyCondition.흐림;
  }
}

/**
 * Open-Meteo 강수 정보 → 공통 강수형태
 *
 * 시간별 데이터에서는 rain/snowfall을 우선한다.
 * 일별 summary처럼 rain/snowfall이 없으면 weatherCode로 판단한다.
 */

type MapPrecipitationTypeParams = {
  weatherCode: number | null;
  rain?: number | null;
  snowfall?: number | null;
};

function mapWeatherCodeToPrecipitationType({
  weatherCode,
  rain = null,
  snowfall = null,
}: MapPrecipitationTypeParams): PrecipitationType {
  const hasRain = rain != null && rain > 0;
  const hasSnow = snowfall != null && snowfall > 0;

  if (hasRain && hasSnow) {
    return PrecipitationType.비눈;
  }

  if (hasSnow) {
    return PrecipitationType.눈;
  }

  if (hasRain) {
    return PrecipitationType.비;
  }

  switch (weatherCode) {
    /**
     * 맑음 / 구름 / 안개
     */
    case 0:
    case 1:
    case 2:
    case 3:
    case 45:
    case 48:
      return PrecipitationType.없음;

    /**
     * 이슬비 / 어는 이슬비
     */
    case 51:
    case 53:
    case 55:
    case 56:
    case 57:
      return PrecipitationType.빗방울;

    /**
     * 비 / 어는 비 / 소나기
     */
    case 61:
    case 63:
    case 65:
    case 66:
    case 67:
    case 80:
    case 81:
    case 82:
      return PrecipitationType.비;

    /**
     * 눈 / 싸락눈 / 눈 소나기
     */
    case 71:
    case 73:
    case 75:
    case 77:
    case 85:
    case 86:
      return PrecipitationType.눈;

    /**
     * 뇌우
     *
     * 현재 공통 타입에 thunderstorm/hail이 없으므로 비로 축약
     */
    case 95:
    case 96:
    case 99:
      return PrecipitationType.비;

    default:
      return PrecipitationType.없음;
  }
}

function formatPrecipitationAmount(
  precipitation: number | null,
): string | null {
  if (precipitation == null) {
    return null;
  }

  if (precipitation <= 0) {
    return "강수없음";
  }

  return `${precipitation}mm`;
}

function getNonNullableValues(values: Array<number | null>): number[] {
  return values.filter((value): value is number => value != null);
}
