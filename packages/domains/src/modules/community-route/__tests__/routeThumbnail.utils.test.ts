import { describe, expect, it } from "vitest";
import {
  dedupeNearbyPoints,
  getCoordinateBounds,
  normalizeCoordsToCanvas,
  pointsToPath,
} from "../routeThumbnail.utils";

const SIZE = { width: 100, height: 100, padding: 0 };

describe("getCoordinateBounds", () => {
  it("좌표들의 최소·최대 위경도를 구한다", () => {
    const bounds = getCoordinateBounds([
      { lat: 1, lng: 10 },
      { lat: 5, lng: 2 },
    ]);

    expect(bounds).toEqual({ minLat: 1, maxLat: 5, minLng: 2, maxLng: 10 });
  });
});

describe("normalizeCoordsToCanvas", () => {
  it("경도가 클수록 오른쪽으로 간다", () => {
    const bounds = { minLng: 0, maxLng: 10, minLat: 0, maxLat: 10 };
    const [left, right] = normalizeCoordsToCanvas(
      [{ lat: 0, lng: 0 }, { lat: 0, lng: 10 }],
      bounds,
      SIZE,
    );

    expect(left.x).toBe(0);
    expect(right.x).toBe(100);
  });

  it("위도가 클수록 위로 간다 — 화면 y 는 뒤집힌다", () => {
    const bounds = { minLng: 0, maxLng: 10, minLat: 0, maxLat: 10 };
    const [south, north] = normalizeCoordsToCanvas(
      [{ lat: 0, lng: 0 }, { lat: 10, lng: 0 }],
      bounds,
      SIZE,
    );

    expect(south.y).toBe(100);
    expect(north.y).toBe(0);
  });

  it("여백만큼 안쪽으로 들여 그린다", () => {
    const bounds = { minLng: 0, maxLng: 10, minLat: 0, maxLat: 10 };
    const [point] = normalizeCoordsToCanvas(
      [{ lat: 10, lng: 0 }],
      bounds,
      { width: 100, height: 100, padding: 10 },
    );

    expect(point).toEqual({ x: 10, y: 10 });
  });

  it("좌표가 모두 같으면 0으로 나누지 않고 여백 위치에 둔다", () => {
    const bounds = { minLng: 5, maxLng: 5, minLat: 5, maxLat: 5 };
    const [point] = normalizeCoordsToCanvas([{ lat: 5, lng: 5 }], bounds, SIZE);

    expect(Number.isNaN(point.x)).toBe(false);
    expect(Number.isNaN(point.y)).toBe(false);
  });
});

describe("pointsToPath", () => {
  it("첫 점은 M, 나머지는 L 로 잇고 닫는다", () => {
    expect(pointsToPath([{ x: 1, y: 2 }, { x: 3, y: 4 }])).toBe("M1.00,2.00 L3.00,4.00 Z");
  });

  it("점이 없으면 빈 문자열이다", () => {
    expect(pointsToPath([])).toBe("");
  });
});

describe("dedupeNearbyPoints", () => {
  it("가까이 붙은 점은 먼저 온 것만 남긴다", () => {
    const points = [{ x: 0, y: 0 }, { x: 1, y: 1 }];

    expect(dedupeNearbyPoints(points)).toEqual([{ x: 0, y: 0 }]);
  });

  it("충분히 떨어진 점은 모두 남는다", () => {
    const points = [{ x: 0, y: 0 }, { x: 50, y: 50 }];

    expect(dedupeNearbyPoints(points)).toEqual(points);
  });

  it("점이 없으면 빈 배열이다", () => {
    expect(dedupeNearbyPoints([])).toEqual([]);
  });
});
