import { describe, expect, it } from "vitest";
import { getMarineActivityMarkerItems } from "../marineActivity.api";
import { MarineActivityType } from "../marineActivity.types";

describe("marine activity markers", () => {
  it("같은 placeCode 지수는 하나의 마커로 묶는다", () => {
    const markerItems = getMarineActivityMarkerItems({
      date: "2026-08-13",
      coordinate: { lat: 33.4996, lng: 126.5312 },
      indices: [
        {
          type: MarineActivityType.Beach,
          date: "2026-08-13",
          placeCode: "JJ1",
          placeName: "중문색달해수욕장",
          coordinate: { lat: 33.2451, lng: 126.4099 },
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
          placeCode: "JJ1",
          placeName: "중문색달해수욕장",
          coordinate: { lat: 33.2268, lng: 126.5831 },
          distanceMeters: 1200,
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
    });

    expect(markerItems).toHaveLength(1);
    expect(markerItems[0]?.indices.map((index) => index.type)).toEqual([
      MarineActivityType.Beach,
      MarineActivityType.SkinScuba,
    ]);
  });

  it("placeCode가 다르면 마커도 분리한다", () => {
    const markerItems = getMarineActivityMarkerItems({
      date: "2026-08-13",
      coordinate: { lat: 33.4996, lng: 126.5312 },
      indices: [
        {
          type: MarineActivityType.Beach,
          date: "2026-08-13",
          placeCode: "GS1",
          placeName: "경포해수욕장",
          coordinate: { lat: 37.7995, lng: 128.9098 },
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
          placeCode: "BSBS",
          placeName: "광안리 인근 포인트",
          coordinate: { lat: 35.1532, lng: 129.1186 },
          distanceMeters: 1200,
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
    });

    expect(markerItems).toHaveLength(2);
    expect(markerItems.map((markerItem) => markerItem.placeCode)).toEqual(["BSBS", "GS1"]);
  });
});
