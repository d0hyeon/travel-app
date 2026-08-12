import { getHours } from "date-fns";
import { useMemo } from "react";
import { useDailyWeatherForecast, type UseDailyWeatherForecastParams } from "./useDailyWeatherForecast";

export type HourlyForecastScope = 'AM' | 'PM';

const AFTERNOON_START_HOUR = 12;

export interface UseHourlyForecastParams extends UseDailyWeatherForecastParams {
  scope?: HourlyForecastScope;
}

/**
 * 하루 예보에서 시간대(오전/오후) 구간만 잘라낸다.
 * scope가 없으면 하루 전체를 그대로 반환한다.
 */
export function useHourlyForecast({ scope, ...params }: UseHourlyForecastParams) {
  const { data: weatherForecast } = useDailyWeatherForecast(params);

  const hourly = useMemo(() => {
    if (weatherForecast == null) return [];

    const { hourly } = weatherForecast.forecast;
    if (scope === 'AM') {
      return hourly.filter(x => getHours(x.forecastAt) < AFTERNOON_START_HOUR);
    }
    if (scope === 'PM') {
      return hourly.filter(x => getHours(x.forecastAt) >= AFTERNOON_START_HOUR);
    }
    return hourly;
  }, [scope, weatherForecast]);

  return { forecast: weatherForecast?.forecast ?? null, hourly };
}
