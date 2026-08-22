import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HourlyForecastItem } from "../HourlyForecastItem";
import {
  PrecipitationType,
  SkyCondition,
  type HourlyWeatherForecast,
} from "@waylog/domains/modules/weather";

vi.mock("../WeatherIcon", () => ({
  WeatherIcon: () => <span aria-hidden="true" />,
}));

const FORECAST: HourlyWeatherForecast = {
  forecastAt: "2026-08-13T17:00:00+09:00",
  temperature: 25,
  humidity: 50,
  skyCondition: SkyCondition.맑음,
  precipitationType: PrecipitationType.없음,
  precipitationProbability: 0,
  precipitationAmount: "강수없음",
  windDirection: 0,
  windSpeed: 1,
};

describe("HourlyForecastItem", () => {
  afterEach(() => vi.useRealTimers());

  it("다른 날짜의 같은 시각은 현재 시각으로 강조하지 않는다", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-12T17:00:00+09:00"));

    const { container } = render(
      <HourlyForecastItem
        forecast={FORECAST}
        precipitationType={PrecipitationType.없음}
      />,
    );

    expect(screen.getByText("오후 5시")).toBeTruthy();
    expect(getComputedStyle(container.firstElementChild!).borderColor).not.toBe(
      "#1976d2",
    );

  });

  it("같은 날짜의 같은 시각은 현재 시각으로 강조한다", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-13T17:00:00+09:00"));

    const { container } = render(
      <HourlyForecastItem
        forecast={FORECAST}
        precipitationType={PrecipitationType.없음}
      />,
    );

    expect(getComputedStyle(container.firstElementChild!).borderColor).toBe(
      "#1976d2",
    );
  });
});
