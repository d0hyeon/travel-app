import { assertEquals } from "jsr:@std/assert@1";
import type { IncheonTerminalCode } from "../../airport-arrival-guidance/incheonTerminal.ts";
import { toDepartureGateRecommendationMessage } from "./departureGateRecommendationMessage.ts";

const recommendation = {
  gate: "DG3_E",
  observedAt: "2026-10-10T05:25:00.000Z",
};
const departure: { terminal: IncheonTerminalCode } = { terminal: "T1" };

Deno.test("출국장 코드를 한글 라벨로 바꾼다", () => {
  assertEquals(
    toDepartureGateRecommendationMessage(recommendation, departure).body,
    "지금 출국장 3 동쪽이 가장 여유로워요. (14:25 기준)",
  );
});

Deno.test("모르는 출국장 코드는 원문을 쓴다", () => {
  assertEquals(
    toDepartureGateRecommendationMessage({ ...recommendation, gate: "DG9_X" }, departure).body,
    "지금 DG9_X이 가장 여유로워요. (14:25 기준)",
  );
});

Deno.test("관측 시각을 한국 시각 HH:mm 으로 쓴다", () => {
  assertEquals(
    toDepartureGateRecommendationMessage(
      { ...recommendation, observedAt: "2026-10-10T15:05:00.000Z" },
      departure,
    ).body,
    "지금 출국장 3 동쪽이 가장 여유로워요. (00:05 기준)",
  );
});

Deno.test("제목에 출발 터미널을 넣는다", () => {
  assertEquals(
    toDepartureGateRecommendationMessage(recommendation, { terminal: "T1" }).title,
    "인천공항 제1터미널 출국장 안내",
  );
  assertEquals(
    toDepartureGateRecommendationMessage(recommendation, { terminal: "T2" }).title,
    "인천공항 제2터미널 출국장 안내",
  );
});
