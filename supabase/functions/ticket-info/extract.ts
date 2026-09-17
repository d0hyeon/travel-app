// packages/domains/src/modules/trip-transport/ticketInfo.utils.ts 의 사본이다.
// 한쪽을 고치면 다른 쪽도 고친다. 테스트는 도메인 쪽에 있다.

export interface TicketInfo {
  seat?: string
}

// 라벨에 의존하지 않는다. 실제 탑승권 7종의 OCR 결과를 보면 라벨과 값이
// 붙어 있지 않다 -- ANA 는 "FLIGHT GATE BOARDING SEAT" 뒤에 값이 몰려 나오고,
// 베트남항공은 라벨이 "CỦA IGATE" 로 깨진다.
// 좌석은 형식 자체가 고유해서(1~3자리 + A~K) 라벨 없이 식별된다.
const SEAT_PATTERN = /\b(\d{1,3}[A-K])\b/g

// 반쪽이 둘인 탑승권은 같은 좌석이 두 번 인쇄된다. 값이 같으면 그대로 쓰고,
// 서로 다르면 어느 것이 내 것인지 정할 수 없어 비운다 --
// 틀린 좌석을 보여주는 것은 빈 카드보다 나쁘다.
function findConsistentMatch(text: string, pattern: RegExp): string | undefined {
  const matched = [...text.matchAll(pattern)].map(([, captured]) => captured)
  const distinct = [...new Set(matched)]

  return distinct.length === 1 ? distinct[0] : undefined
}

export function extractTicketInfo(text: string): TicketInfo {
  return {
    seat: findConsistentMatch(text, SEAT_PATTERN),
  }
}
