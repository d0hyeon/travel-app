import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { describe, expect, it, vi } from "vitest";
import { TripWeatherForecastSheet } from "../TripWeatherForecastSheet";

vi.mock("~features/weather/useDailyWeatherForecast", () => ({
  useDailyWeatherForecast: ({ date }: { date: string }) => ({
    data:
      date === "2000-01-01"
        ? undefined
        : {
            forecast: {
              date,
              summary: {},
              periods: { am: {}, pm: {} },
              hourly: [{ forecastAt: `${date}T13:00:00+09:00` }],
            },
          },
  }),
}));

vi.mock("~features/weather/DailyWeatherInfoBox", () => ({
  DailyWeatherInfoBox: () => <div />,
}));

vi.mock("~features/weather/HourlyForecastList", () => ({
  HourlyForecastList: () => <div />,
}));

vi.mock("~shared/components/bottom-sheet/BottomSheet", () => {
  function BottomSheet({ children }: PropsWithChildren) {
    return <>{children}</>;
  }

  BottomSheet.Header = ({ children }: PropsWithChildren) => <>{children}</>;
  BottomSheet.Body = ({ children }: PropsWithChildren) => <>{children}</>;

  return { BottomSheet };
});

vi.mock("../../useTrip", () => ({
  useTrip: () => ({
    data: {
      startDate: "2000-01-01",
      endDate: "2000-01-02",
      lat: 37.5665,
      lng: 126.978,
    },
  }),
}));

describe("TripWeatherForecastSheet", () => {
  it("예보 범위 밖 날짜를 선택하면 제공 불가 안내를 표시한다", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <TripWeatherForecastSheet
          tripId="trip-1"
          initialDate="2000-01-01"
          isOpen
          onClose={() => undefined}
        />
      </QueryClientProvider>,
    );

    expect(
      await screen.findByText("이 날짜는 예보를 제공하지 않아요"),
    ).toBeTruthy();
  });

  it("오후 예보만 있으면 오후 버튼만 표시한다", async () => {
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <TripWeatherForecastSheet
          tripId="trip-1"
          initialDate="2000-01-02"
          isOpen
          onClose={() => undefined}
        />
      </QueryClientProvider>,
    );

    expect(await screen.findByRole("button", { name: "오후" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "오전" })).toBeNull();
  });
});
