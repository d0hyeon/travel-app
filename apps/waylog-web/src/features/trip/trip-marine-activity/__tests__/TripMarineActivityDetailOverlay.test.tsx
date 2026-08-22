import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TripMarineActivityDetailOverlay } from "../TripMarineActivityDetailOverlay";

vi.mock("~shared/hooks/env/useIsMobile", () => ({
  useIsMobile: vi.fn(() => false),
}));

// 서브트리 전체를 대체하면 같은 모듈의 타입·상수 export가 사라진다.
vi.mock("@waylog/domains/modules/marine-activity", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@waylog/domains/modules/marine-activity")>()),
  useDailyMarineActivityIndices: vi.fn(({ date }: { date: string }) => ({
    data: {
      date,
      coordinate: { lat: 33.2451, lng: 126.4099 },
      indices: [
        {
          type: "beach",
          date,
          placeCode: "JJ1",
          placeName: "중문색달해수욕장",
          coordinate: { lat: 33.2451, lng: 126.4099 },
          distanceMeters: 1000,
          grade: date === "2026-08-14" ? "normal" : "good",
          gradeLabel: date === "2026-08-14" ? "보통" : "좋음",
          score: null,
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
  })),
}));

describe("TripMarineActivityDetailOverlay", () => {
  it("날짜를 바꾸면 해당 날짜의 해양 활동 지수를 표시한다", async () => {
    render(
      <TripMarineActivityDetailOverlay
        isOpen
        onClose={vi.fn()}
        trip={{
          id: "trip-1",
          userId: "user-1",
          name: "제주 여행",
          destinations: ["제주"],
          lat: 33.2451,
          lng: 126.4099,
          startDate: "2026-08-13",
          endDate: "2026-08-14",
          shareLink: "share-link",
          createdAt: "2026-08-01",
          exchangeRate: null,
          exchangeRates: null,
        }}
        placeCode="JJ1"
        placeName="중문색달해수욕장"
        initialDate="2026-08-13"
      />,
    );

    expect(screen.getByText("좋음")).toBeTruthy();
    expect(screen.getByText("해수욕 지수")).toBeTruthy();
    await userEvent.click(screen.getByRole("tab", { name: "8/14" }));
    expect(screen.getByText("보통")).toBeTruthy();
  });
});
