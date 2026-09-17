// packages/domains/src/modules/trip-transport/ticketInfo.utils.ts 의 사본이다.
// 한쪽을 고치면 다른 쪽도 고친다. 테스트는 도메인 쪽에 있다.

export interface TicketInfo {
  seat?: string
  terminal?: string
  gate?: string
}

const TICKET_INFO_PATTERN = {
  seat: /(?:SEAT|좌석)\s*[:\s]\s*([0-9]{1,3}[A-K])\b/gi,
  terminal: /(?:TERMINAL|터미널)\s*[:\s]?\s*T?([0-9])\b|제\s*([0-9])\s*여객터미널/gi,
  gate: /(?:GATE|탑승구|게이트)\s*[:\s]?\s*([0-9]{1,3}[A-Z]?)\b/gi,
} as const

// 틀린 게이트를 보여주는 것은 빈 카드보다 나쁘다.
// 라벨이 여러 번 나오면 어느 것이 내 것인지 정할 수 없어 비운다.
function findUniqueMatch(text: string, pattern: RegExp): string | undefined {
  const matches = [...text.matchAll(pattern)]
  const isAmbiguous = matches.length !== 1
  if (isAmbiguous) return undefined

  const [captured] = matches[0].slice(1).filter((group) => group != null)
  return captured
}

export function extractTicketInfo(text: string): TicketInfo {
  return {
    seat: findUniqueMatch(text, TICKET_INFO_PATTERN.seat),
    terminal: findUniqueMatch(text, TICKET_INFO_PATTERN.terminal),
    gate: findUniqueMatch(text, TICKET_INFO_PATTERN.gate),
  }
}
