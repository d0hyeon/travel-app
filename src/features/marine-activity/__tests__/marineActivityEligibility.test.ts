import { describe, expect, it } from "vitest";
import {
  getTripMarineActivityEligibility,
  isIslandDestinationName,
} from "../marineActivityEligibility";
import { MarineActivityDisableReason } from "../marineActivity.types";

describe("marineActivityEligibility", () => {
  it.each(["제주", "울릉도", "거제도"])(
    "%s 목적지는 해양 지수 대상이다",
    (destinationName) => {
      expect(isIslandDestinationName(destinationName)).toBe(true);
    },
  );

  it("서울 좌표는 내륙으로 판정한다", () => {
    const eligibility = getTripMarineActivityEligibility({
      destinations: ["서울"],
      coordinate: { lat: 37.5665, lng: 126.978 },
    });

    expect(eligibility).toEqual({
      isEligible: false,
      reason: MarineActivityDisableReason.NotMarineDestination,
    });
  });

  it("부산과 제주 좌표는 목적지 이름이 일반적이어도 대상이다", () => {
    const busanEligibility = getTripMarineActivityEligibility({
      destinations: ["부산 여행"],
      coordinate: { lat: 35.1796, lng: 129.0756 },
    });
    const jejuEligibility = getTripMarineActivityEligibility({
      destinations: ["가족 여행"],
      coordinate: { lat: 33.4996, lng: 126.5312 },
    });

    expect(busanEligibility.isEligible).toBe(true);
    expect(jejuEligibility.isEligible).toBe(true);
  });

  it("좌표가 없고 섬 목적지도 아니면 대상이 아니다", () => {
    const eligibility = getTripMarineActivityEligibility({
      destinations: ["대전"],
      coordinate: null,
    });

    expect(eligibility).toEqual({
      isEligible: false,
      reason: MarineActivityDisableReason.NotMarineDestination,
    });
  });
});
