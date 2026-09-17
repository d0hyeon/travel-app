export interface TicketInfo {
  seat?: string
  terminal?: string
  gate?: string
}

const SEAT_SHAPE = /^\d{1,3}[A-K]$/
const TIME_SHAPE = /^\d{1,2}:\d{2}$/

// "GATE CLOSES 10 MINS BEFORE" 같은 안내 문구의 GATE 는 라벨이 아니다.
const NOTICE_PHRASE = /CLOSE|CLOTURE|prior|BEFORE|MINS|INVITED/i

const GATE_LABEL = /^(?:GATE|탑승구|게이트|Porte\/Gate|Porte)$/i
const GATE_VALUE = /^[A-Z]?\d{1,3}[A-Z]?$/

const TERMINAL_LABEL = /^(?:TERMINAL|터미널)$/i
const TERMINAL_VALUE = /^(?:T\d|\d|국내선|국제선|[A-E])$/

function toWords(text: string): string[] {
  return text
    .split(/[\n\s]+/)
    .map((word) => word.trim())
    .filter(Boolean)
}

// 라벨과 값이 붙어 있지 않다. ANA 는 라벨 넷을 먼저 묶어 내놓고
// (FLIGHT GATE BOARDING SEAT) 값을 뒤에 몰아 놓는다.
// 그래서 라벨 뒤 넓은 창에서 그 필드의 형식에 맞는 첫 값을 고른다.
// 라벨이 여러 번 나와도 값이 같으면 쓰고, 서로 다르면 어느 구간의 것인지
// 정할 수 없어 비운다 -- 에어프랑스는 한 장에 두 구간이 인쇄된다.
function findLabelledValue(text: string, label: RegExp, value: RegExp): string | undefined {
  const words = toWords(text)
  const found = new Set<string>()

  words.forEach((word, index) => {
    if (!label.test(word)) return
    if (NOTICE_PHRASE.test(words.slice(index, index + 3).join(' '))) return

    for (const candidate of words.slice(index + 1, index + 11)) {
      if (TIME_SHAPE.test(candidate)) continue
      if (SEAT_SHAPE.test(candidate)) continue
      if (label.test(candidate)) continue
      if (value.test(candidate)) {
        found.add(candidate)
        break
      }
    }
  })

  const distinct = [...found]
  return distinct.length === 1 ? distinct[0] : undefined
}

// 좌석은 형식이 고유해 라벨 없이 찾는다. 라벨 표기가 GHE/SEAT·좌석번호·
// 座位号 처럼 갈리고 OCR 이 붙여 읽기도 해서 라벨에 의존할 수 없다.
function findSeat(text: string): string | undefined {
  const cleaned = toWords(text)
    // e-티켓 번호(025/ICNKG61/002K/J)의 조각이 좌석으로 잡힌다.
    .filter((word) => !word.includes('/') || word.length <= 6)
    .join(' ')
    .replace(/\b\d{1,2}:\d{2}\b/g, ' ')
    // ANA 는 좌석 앞에 구역을 붙인다: (Z)1A
    .replace(/\([A-Z]\)/g, ' ')

  const matched = [...cleaned.matchAll(/(?:^|\s)(\d{1,3}[A-K])(?=$|\s)/g)].map(
    ([, captured]) => captured,
  )
  const distinct = [...new Set(matched)]

  return distinct.length === 1 ? distinct[0] : undefined
}

export function extractTicketInfo(text: string): TicketInfo {
  return {
    seat: findSeat(text),
    terminal: findLabelledValue(text, TERMINAL_LABEL, TERMINAL_VALUE),
    gate: findLabelledValue(text, GATE_LABEL, GATE_VALUE),
  }
}
