import { useSuspenseQuery } from "@waylog/react";
import type { Coordinate } from "@waylog/domains/utils";
import { isOverseasByCoordinate } from "@waylog/domains/utils";
import forecastApi from "./weather.api";
import domesticForecastApi from "./domestic-weather.api";

export interface UseDailyWeatherForecastParams {
  date: string;
  coordinate: Coordinate;
}

export function useDailyWeatherForecast(params: UseDailyWeatherForecastParams) {
  const isDomestic = !isOverseasByCoordinate(params.coordinate);
  const availableForecastApi = isDomestic ? domesticForecastApi : forecastApi;
  const isForecastAvailable = availableForecastApi.getIsAvailability(
    params.date,
  );

  return useSuspenseQuery({
    queryKey: useDailyWeatherForecast.key(params),
    enabled: isForecastAvailable,
    queryFn: async () => {
      const data = await availableForecastApi.getDailyForecast(params);
      return { provider: availableForecastApi.provider, forecast: data };
    },
  });
}

useDailyWeatherForecast.key = (
  params: Partial<UseDailyWeatherForecastParams>,
) => {
  return ["daily-weather-forecast", params];
};
