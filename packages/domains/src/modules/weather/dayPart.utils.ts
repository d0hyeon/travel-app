import { getHours } from "date-fns";
import type { DayPart, HourlyWeatherForecast } from "./weather.types";

const AFTERNOON_START_HOUR = 12;

/** 예보 시각이 해당 시간대(오전/오후)에 속하는지 판정한다. */
export function isInDayPart(forecastAt: string, dayPart: DayPart) {
  const hours = getHours(forecastAt);

  return dayPart === "am"
    ? hours < AFTERNOON_START_HOUR
    : hours >= AFTERNOON_START_HOUR;
}

/**
 * 해당 시간대에 실제 시간별 예보가 있는지 판정한다.
 * 예보 범위가 하루 중간부터 시작하면 한쪽 시간대가 비는데, 이때 그 구간을 노출하지 않기 위해 쓴다.
 */
export function hasDayPartForecast(
  hourly: HourlyWeatherForecast[],
  dayPart: DayPart,
) {
  return hourly.some(({ forecastAt }) => isInDayPart(forecastAt, dayPart));
}
