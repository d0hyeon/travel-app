import { assertEquals } from 'jsr:@std/assert@1'
import { getGuidanceTerminal, toIncheonTerminalCode } from './incheonTerminal.ts'

Deno.test('P01 은 T1 이다', () => {
  assertEquals(toIncheonTerminalCode('P01'), 'T1')
})

Deno.test('P02 탑승동은 T1 이다', () => {
  assertEquals(toIncheonTerminalCode('P02'), 'T1')
})

Deno.test('P03 은 T2 이다', () => {
  assertEquals(toIncheonTerminalCode('P03'), 'T2')
})

Deno.test('모르는 코드는 null 이다', () => {
  assertEquals(toIncheonTerminalCode('P09'), null)
})

Deno.test('null 은 null 이다', () => {
  assertEquals(toIncheonTerminalCode(null), null)
})

Deno.test('해외 인천 출발이고 터미널을 알면 코드와 원본 ID 를 돌려준다', () => {
  assertEquals(
    getGuidanceTerminal({
      isOverseas: true,
      departureAirportCode: 'ICN',
      flightStatusTerminal: 'P02',
      ticketTerminal: null,
    }),
    { snapshotTerminal: 'T1', responseTerminal: 'P02' },
  )
})

Deno.test('해외인데 인천 출발이 아니면 null 이다', () => {
  assertEquals(
    getGuidanceTerminal({
      isOverseas: true,
      departureAirportCode: 'NRT',
      flightStatusTerminal: 'P01',
      ticketTerminal: 'T1',
    }),
    null,
  )
})

Deno.test('해외인데 운항 상태 터미널이 없으면 null 이다', () => {
  assertEquals(
    getGuidanceTerminal({
      isOverseas: true,
      departureAirportCode: 'ICN',
      flightStatusTerminal: null,
      ticketTerminal: 'T1',
    }),
    null,
  )
})

Deno.test('해외는 탑승권 터미널이 있어도 쓰지 않는다', () => {
  assertEquals(
    getGuidanceTerminal({
      isOverseas: true,
      departureAirportCode: 'ICN',
      flightStatusTerminal: 'P03',
      ticketTerminal: 'T1',
    }),
    { snapshotTerminal: 'T2', responseTerminal: 'P03' },
  )
})

Deno.test('국내는 탑승권 터미널을 그대로 쓴다', () => {
  assertEquals(
    getGuidanceTerminal({
      isOverseas: false,
      departureAirportCode: 'GMP',
      flightStatusTerminal: null,
      ticketTerminal: '국내선',
    }),
    { snapshotTerminal: '국내선', responseTerminal: '국내선' },
  )
})

Deno.test('국내인데 탑승권 터미널이 없으면 null 이다', () => {
  assertEquals(
    getGuidanceTerminal({
      isOverseas: false,
      departureAirportCode: 'GMP',
      flightStatusTerminal: 'P01',
      ticketTerminal: null,
    }),
    null,
  )
})
