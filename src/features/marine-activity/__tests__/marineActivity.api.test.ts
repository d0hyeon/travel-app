import { describe, expect, it } from "vitest";
import { toMarineActivityGrade, toMarineActivityRequestDate } from "../marineActivity.api";
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
});
