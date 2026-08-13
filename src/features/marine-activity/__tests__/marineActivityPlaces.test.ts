import { describe, expect, it } from "vitest";
import {
  getDistanceMeters,
  getNearestMarineActivityPlace,
  getSupportedMarineActivityTypes,
} from "../marineActivityPlaces";
import { MarineActivityType } from "../marineActivity.types";

describe("marineActivityPlaces", () => {
  it("제주 좌표는 해수욕 장소를 찾는다", () => {
    const place = getNearestMarineActivityPlace(MarineActivityType.Beach, {
      lat: 33.2451,
      lng: 126.4099,
    });

    expect(place?.placeCode).toBe("JJ1");
  });

  it("내륙 좌표는 지원 장소가 없다", () => {
    const place = getNearestMarineActivityPlace(MarineActivityType.Beach, {
      lat: 37.5665,
      lng: 126.978,
    });

    expect(place).toBeNull();
  });

  it("같은 거리면 사전순 placeCode를 고른다", () => {
    const leftDistance = getDistanceMeters(
      { lat: 35.1587, lng: 129.1604 },
      { lat: 35.1587, lng: 129.1604 },
    );
    const rightDistance = getDistanceMeters(
      { lat: 35.1587, lng: 129.1604 },
      { lat: 35.1587, lng: 129.1604 },
    );

    expect(leftDistance).toBe(rightDistance);
    const place = getNearestMarineActivityPlace(MarineActivityType.Beach, {
      lat: 35.1587,
      lng: 129.1604,
    });
    expect(place?.placeCode).toBe("HS2");
  });

  it("지원 타입은 beach, skinScuba 순으로 정렬한다", () => {
    const supportedTypes = getSupportedMarineActivityTypes({
      lat: 33.2451,
      lng: 126.4099,
    });

    expect(supportedTypes).toEqual([
      MarineActivityType.Beach,
      MarineActivityType.SkinScuba,
    ]);
  });
});
