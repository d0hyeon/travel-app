import { describe, expect, it } from "vitest";
import {
  getMarineActivityMarkerItems,
  toMarineActivityGrade,
  toMarineActivityRequestDate,
} from "../marineActivity.api";
import { MarineActivityGrade } from "../marineActivity.types";

describe("marineActivity.api", () => {
  it("요청 날짜를 YYYYMMDD로 변환한다", () => {
    expect(toMarineActivityRequestDate("2026-08-12")).toBe("20260812");
  });

  it.each([
    ["매우 좋음", MarineActivityGrade.VeryGood],
    ["좋음", MarineActivityGrade.Good],
    ["보통", MarineActivityGrade.Normal],
    ["나쁨", MarineActivityGrade.Bad],
    ["매우 나쁨", MarineActivityGrade.VeryBad],
    [85, MarineActivityGrade.VeryGood],
    [65, MarineActivityGrade.Good],
    [45, MarineActivityGrade.Normal],
    [25, MarineActivityGrade.Bad],
    [5, MarineActivityGrade.VeryBad],
  ])("등급 %s 를 %s 로 정규화한다", (value, expectedGrade) => {
    expect(toMarineActivityGrade(value)).toBe(expectedGrade);
  });

  it("마커 좌표는 지수 응답 좌표를 사용한다", () => {
    const markerItems = getMarineActivityMarkerItems({
      date: "2026-08-14",
      coordinate: { lat: 37.7519, lng: 128.8761 },
      indices: [
        {
          type: "beach",
          date: "2026-08-14",
          placeCode: "GP",
          placeName: "경포해수욕장",
          coordinate: { lat: 37.7995, lng: 128.9098 },
          distanceMeters: 6065,
          grade: MarineActivityGrade.Good,
          gradeLabel: "좋음",
          score: 72,
          observedAt: "0900",
          metrics: {
            waterTemperatureCelsius: 22,
            waveHeightMeters: 0.8,
            windSpeedMetersPerSecond: 3.1,
            airTemperatureCelsius: 28,
            currentSpeedMetersPerSecond: null,
            tideLabel: null,
          },
        },
      ],
    });

    expect(markerItems[0]?.coordinate).toEqual({ lat: 37.7995, lng: 128.9098 });
  });

  it("실제 응답 필드명으로 해수욕 데이터를 읽는다", () => {
    const markerItems = getMarineActivityMarkerItems({
      date: "2026-08-14",
      coordinate: { lat: 36.35, lng: 126.53 },
      indices: [
        {
          type: "beach",
          date: "2026-08-14",
          placeCode: "대천해수욕장",
          placeName: "대천해수욕장",
          coordinate: { lat: 36.30555, lng: 126.51601 },
          distanceMeters: 0,
          grade: MarineActivityGrade.Good,
          gradeLabel: "좋음",
          score: null,
          observedAt: "2026-08-14",
          metrics: {
            waterTemperatureCelsius: 28.2,
            waveHeightMeters: 0.2,
            windSpeedMetersPerSecond: 4.9,
            airTemperatureCelsius: 26.9,
            currentSpeedMetersPerSecond: null,
            tideLabel: null,
          },
        },
      ],
    });

    expect(markerItems[0]?.placeName).toBe("대천해수욕장");
  });
});
