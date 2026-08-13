import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TripMarineActivityIndexBar } from "../TripMarineActivityIndexBar";
import { MarineActivityType } from "~features/marine-activity/marineActivity.types";

vi.mock("~features/marine-activity/useDailyMarineActivityIndices", () => ({
  useDailyMarineActivityIndices: vi.fn(),
}));

const { useDailyMarineActivityIndices } = await import(
  "~features/marine-activity/useDailyMarineActivityIndices"
);

const eligibleTrip = {
  id: "trip-1",
  userId: null,
  name: "제주 여행",
  destinations: ["제주"],
  lat: 33.4996,
  lng: 126.5312,
  startDate: "2026-08-12",
  endDate: "2026-08-14",
  shareLink: "",
  createdAt: "2026-08-12T00:00:00Z",
  exchangeRate: null,
  exchangeRates: null,
};

describe("TripMarineActivityIndexBar", () => {
  it("내륙 여행이면 아무것도 렌더하지 않는다", () => {
    vi.mocked(useDailyMarineActivityIndices).mockReturnValue({
      isLoading: false,
      isError: false,
      data: undefined,
    } as never);

    const { container } = render(
      <TripMarineActivityIndexBar
        trip={{ ...eligibleTrip, destinations: ["서울"], lat: 37.5665, lng: 126.978 }}
        selectedDate="2026-08-13"
      />,
    );

    expect(container.innerHTML).toBe("");
  });

  it("로딩 상태면 스켈레톤을 렌더한다", () => {
    vi.mocked(useDailyMarineActivityIndices).mockReturnValue({
      isLoading: true,
      isError: false,
      data: undefined,
    } as never);

    const { container } = render(
      <TripMarineActivityIndexBar trip={eligibleTrip} selectedDate="2026-08-13" />,
    );

    expect(container.querySelectorAll(".MuiSkeleton-root")).toHaveLength(2);
  });

  it("데이터가 있으면 해수욕과 스킨스쿠버를 보여준다", () => {
    vi.mocked(useDailyMarineActivityIndices).mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        date: "2026-08-13",
        coordinate: { lat: 33.4996, lng: 126.5312 },
        indices: [
          {
            type: MarineActivityType.Beach,
            date: "2026-08-13",
            placeCode: "JJ1",
            placeName: "중문색달해수욕장",
            distanceMeters: 1000,
            grade: "good",
            gradeLabel: "좋음",
            score: 70,
            observedAt: null,
            metrics: {
              waterTemperatureCelsius: 24,
              waveHeightMeters: 0.7,
              windSpeedMetersPerSecond: 3,
              airTemperatureCelsius: 28,
              currentSpeedMetersPerSecond: null,
              tideLabel: null,
            },
          },
          {
            type: MarineActivityType.SkinScuba,
            date: "2026-08-13",
            placeCode: "BSSW",
            placeName: "문섬",
            distanceMeters: 2000,
            grade: "veryGood",
            gradeLabel: "매우 좋음",
            score: 85,
            observedAt: null,
            metrics: {
              waterTemperatureCelsius: 23,
              waveHeightMeters: 0.5,
              windSpeedMetersPerSecond: 2,
              airTemperatureCelsius: 27,
              currentSpeedMetersPerSecond: 0.2,
              tideLabel: "보통",
            },
          },
        ],
      },
    } as never);

    render(<TripMarineActivityIndexBar trip={eligibleTrip} selectedDate="2026-08-13" />);

    expect(screen.getByText("해수욕")).toBeTruthy();
    expect(screen.getByText("스킨스쿠버")).toBeTruthy();
    expect(screen.getByText("좋음")).toBeTruthy();
    expect(screen.getByText("매우 좋음")).toBeTruthy();
  });

  it("오류 상태면 실패 문구를 보여준다", () => {
    vi.mocked(useDailyMarineActivityIndices).mockReturnValue({
      isLoading: false,
      isError: true,
      data: undefined,
    } as never);

    render(<TripMarineActivityIndexBar trip={eligibleTrip} selectedDate="2026-08-13" />);

    expect(screen.getByText("해양 지수를 불러오지 못했어요")).toBeTruthy();
  });

  it("카드를 누르면 상세를 연다", async () => {
    vi.mocked(useDailyMarineActivityIndices).mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        date: "2026-08-13",
        coordinate: { lat: 33.4996, lng: 126.5312 },
        indices: [
          {
            type: MarineActivityType.Beach,
            date: "2026-08-13",
            placeCode: "JJ1",
            placeName: "중문색달해수욕장",
            distanceMeters: 1000,
            grade: "good",
            gradeLabel: "좋음",
            score: 70,
            observedAt: null,
            metrics: {
              waterTemperatureCelsius: 24,
              waveHeightMeters: 0.7,
              windSpeedMetersPerSecond: 3,
              airTemperatureCelsius: 28,
              currentSpeedMetersPerSecond: null,
              tideLabel: null,
            },
          },
        ],
      },
    } as never);

    render(<TripMarineActivityIndexBar trip={eligibleTrip} selectedDate="2026-08-13" />);
    await userEvent.click(screen.getByText("좋음"));

    expect(screen.getByText("출처: 국립해양조사원")).toBeTruthy();
  });
});
