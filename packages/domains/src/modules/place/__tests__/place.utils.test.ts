import { describe, expect, it } from "vitest";
import { toTripPlacePatch } from "../place.utils";

describe("toTripPlacePatch", () => {
  it("category를 전달하지 않으면 patch에 category 키가 없다", () => {
    const patch = toTripPlacePatch({ memo: "메모만 수정" });

    expect("category" in patch).toBe(false);
  });

  it("category에 null을 전달하면 미설정으로 저장된다", () => {
    const patch = toTripPlacePatch({ category: null });

    expect(patch.category).toBeNull();
  });

  it("category에 값을 전달하면 그 값이 담긴다", () => {
    const patch = toTripPlacePatch({ category: "cafe" });

    expect(patch.category).toBe("cafe");
  });

  it("빈 문자열 memo는 null로 변환된다", () => {
    const patch = toTripPlacePatch({ memo: "" });

    expect(patch.memo).toBeNull();
  });

  it("status를 전달하지 않으면 patch에 status 키가 없다", () => {
    const patch = toTripPlacePatch({ memo: "메모" });

    expect("status" in patch).toBe(false);
  });

  it("빈 tags 배열은 그대로 담긴다", () => {
    const patch = toTripPlacePatch({ tags: [] });

    expect(patch.tags).toEqual([]);
  });

  it("아무것도 전달하지 않으면 빈 patch를 반환한다", () => {
    expect(toTripPlacePatch({})).toEqual({});
  });
});
