import { renderHook, waitFor } from "@testing-library/react";
import { addDays, format } from "date-fns";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createWrapper } from "~fixtures/wraper";
import * as domesticForecastApi from "../../../../../../packages/domains/src/modules/weather/domestic-weather.api";
import { useDailyWeatherForecast } from "@waylog/domains/modules/weather";
import * as forecastApi from "../../../../../../packages/domains/src/modules/weather/weather.api";

const TODAY = new Date(2026, 7, 12);

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(TODAY);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("weather forecast availability", () => {
  it.each([
    ["Open-Meteo", forecastApi.getIsWeatherForecastAvailability],
    ["기상청", domesticForecastApi.getIsWeatherForecastAvailability],
  ])("%s 예보는 과거 날짜를 허용하지 않는다", (_, getIsAvailability) => {
    expect(getIsAvailability("2026-08-11")).toBe(false);
  });

  it("Open-Meteo 예보는 오늘부터 13일 뒤까지 허용한다", () => {
    expect(forecastApi.getIsWeatherForecastAvailability("2026-08-12")).toBe(true);
    expect(forecastApi.getIsWeatherForecastAvailability("2026-08-25")).toBe(true);
    expect(forecastApi.getIsWeatherForecastAvailability("2026-08-26")).toBe(false);
  });

  it("기상청 예보는 오늘부터 2일 뒤까지 허용한다", () => {
    expect(domesticForecastApi.getIsWeatherForecastAvailability("2026-08-12")).toBe(true);
    expect(domesticForecastApi.getIsWeatherForecastAvailability("2026-08-14")).toBe(true);
    expect(domesticForecastApi.getIsWeatherForecastAvailability("2026-08-15")).toBe(false);
  });

  it.each([
    ["Open-Meteo", forecastApi.getIsWeatherForecastAvailability, "2026-08-26"],
    ["기상청", domesticForecastApi.getIsWeatherForecastAvailability, "2026-08-15"],
  ])(
    "%s 예보는 UTC와 날짜가 다른 시간대에도 현지 날짜 경계를 지킨다",
    (_, getIsAvailability, firstUnavailableDate) => {
      const originalTimezone = process.env.TZ;

      try {
        process.env.TZ = "America/Los_Angeles";
        vi.setSystemTime(new Date("2026-08-13T06:59:00Z"));

        expect(getIsAvailability("2026-08-12")).toBe(true);
        expect(getIsAvailability(firstUnavailableDate)).toBe(false);
      } finally {
        if (originalTimezone === undefined) {
          delete process.env.TZ;
        } else {
          process.env.TZ = originalTimezone;
        }
      }
    },
  );

  it("국내 날짜가 기상청 예보 범위를 벗어나면 해외 API로 폴백하지 않는다", async () => {
    vi.useRealTimers();
    const outsideDomesticForecastRange = format(
      addDays(new Date(), 3),
      "yyyy-MM-dd",
    );
    const domesticRequest = vi
      .spyOn(domesticForecastApi, "getDailyWeatherForecast")
      .mockRejectedValue(new Error("기상청 API가 호출됨"));
    const overseasRequest = vi
      .spyOn(forecastApi, "getDailyWeatherForecast")
      .mockRejectedValue(new Error("Open-Meteo API가 호출됨"));

    const { result } = renderHook(
      () =>
        useDailyWeatherForecast({
          date: outsideDomesticForecastRange,
          coordinate: { lat: 37.5665, lng: 126.978 },
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current).not.toBeNull();
      expect(result.current.data).toBeUndefined();
    });
    expect(domesticRequest).not.toHaveBeenCalled();
    expect(overseasRequest).not.toHaveBeenCalled();
  });
});
