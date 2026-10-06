import { assertEquals } from "jsr:@std/assert@1";
import { toBoardingReminderMessage } from "./boardingReminderMessage.ts";

const flight = {
  type: "flight",
  airline: "대한항공",
  flightNumber: "KE901",
  arrivalCityName: "파리",
  departureName: "인천국제공항",
  arrivalName: "샤를드골공항",
};

Deno.test("항공은 탑승 시작 10분 전이라고 알린다", () => {
  assertEquals(
    toBoardingReminderMessage(flight).body,
    "탑승 시작 10분 전이에요. 탑승을 준비해 주세요",
  );
});

Deno.test("항공 제목에 항공사와 도착 도시와 편명을 담는다", () => {
  assertEquals(
    toBoardingReminderMessage(flight).title,
    "대한항공 파리행 (KE901편) 탑승 안내",
  );
});

Deno.test("편명이 없으면 편명 부분을 뺀다", () => {
  assertEquals(
    toBoardingReminderMessage({ ...flight, flightNumber: null }).title,
    "대한항공 파리행 탑승 안내",
  );
});

Deno.test("기차는 출발 10분 전이라고 알린다", () => {
  const message = toBoardingReminderMessage({ ...flight, type: "train" });

  assertEquals(message.body, "출발 10분 전이에요. 탑승을 준비해 주세요");
});

Deno.test("기차·버스 제목은 출발지 → 도착지다", () => {
  assertEquals(
    toBoardingReminderMessage({
      ...flight,
      type: "bus",
      departureName: "서울",
      arrivalName: "부산",
    }).title,
    "서울 → 부산 탑승 안내",
  );
});
