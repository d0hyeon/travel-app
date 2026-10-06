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
      coordinate: { lat: 37.5665, lng: 126.978 },
    });

    expect(eligibility).toEqual({
      isEligible: false,
      reason: MarineActivityDisableReason.NotMarineDestination,
    });
  });
});
