import { describe, expect, it } from "vitest";
import { findNearestPlace } from "../findNearestPlace.utils";

describe("findNearestPlace", () => {
  it("좌표에서 가장 가까운 장소를 반환한다", () => {
    const coordinate = { lat: 37.5665, lng: 126.978 }; // 서울시청
    const far = { id: "far", lat: 35.1796, lng: 129.0756 }; // 부산
    const near = { id: "near", lat: 37.5651, lng: 126.9895 }; // 광화문 근처

    expect(findNearestPlace(coordinate, [far, near])).toBe(near);
  });

  it("장소 목록이 비어있으면 null을 반환한다", () => {
    expect(findNearestPlace({ lat: 37.5665, lng: 126.978 }, [])).toBeNull();
  });

  it("장소가 하나뿐이면 그 장소를 반환한다", () => {
    const only = { id: "only", lat: 33.4996, lng: 126.5312 };

    expect(findNearestPlace({ lat: 37.5665, lng: 126.978 }, [only])).toBe(only);
  });
});
