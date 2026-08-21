import type { ValueOf } from "@waylog/domains/utils";

export const SkyCondition = {
  맑음: "clear",
  구름많음: "mostlyCloudy",
  흐림: "cloudy",
} as const;

export type SkyCondition = ValueOf<typeof SkyCondition>;

export const PrecipitationType = {
  없음: "none",
  비: "rain",
  비눈: "rainAndSnow",
  눈: "snow",
  빗방울: "raindrop",
  빗방울눈날림: "raindropAndSnowFlurry",
  눈날림: "snowFlurry",
} as const;
export type PrecipitationType = ValueOf<typeof PrecipitationType>;
export type DayPart = "am" | "pm";
export const PRECIPITATION_SNOW_TYPES = [
  PrecipitationType.눈,
  PrecipitationType.눈날림,
  PrecipitationType.비눈,
] satisfies PrecipitationType[];

export type HourlyWeatherForecast = {
  /**
   * ISO 형식 대신 프로젝트에서 다루기 편하게
   * YYYY-MM-DDTHH:mm:00+09:00 형태로 반환한다.
   */
  forecastAt: string;

  temperature: number | null;
  humidity: number | null;

  skyCondition: SkyCondition | null;

  precipitationType: PrecipitationType;
  precipitationProbability: number | null;

  /**
   * 기상청 RN1/PCP는 "강수없음", "1mm 미만"처럼
   * 숫자가 아닌 값도 내려오므로 원문을 유지한다.
   */
  precipitationAmount: string | null;

  windDirection: number | null;
  windSpeed: number | null;
};

export interface SummaryForecast {
  skyCondition: SkyCondition | null;
  precipitationType: PrecipitationType;
  precipitationProbability: number | null;
  minimumTemperature: number | null;
  maximumTemperature: number | null;
}

export type DailyWeatherForecast = {
  date: string;

  summary: SummaryForecast;
  periods: {
    am: SummaryForecast;
    pm: SummaryForecast;
  };

  hourly: HourlyWeatherForecast[];
};

export const WeatherForecastDisableReason = {
  과거일자: "PAST_DATE",
  예보범위초과: "OUT_OF_FORECAST_RANGE",
} as const;
export type WeatherForecastDisableReason = ValueOf<
  typeof WeatherForecastDisableReason
>;

type ForecastAvailabilityResult =
  | { available: true; reason: never }
  | { available: false; reason: WeatherForecastDisableReason };

export interface WeatherForecast<Params = never> {
  getIsAvailability(params: Params): ForecastAvailabilityResult;
  getDailyForecast(params: Params): Promise<DailyWeatherForecast>;
}
