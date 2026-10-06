import { assertEquals } from 'jsr:@std/assert@1'
import {
  findGate,
  getKoreaAirportsWindow,
  getMatchKey,
  toKoreaAirportsKind,
  toObservation,
  type KoreaAirportFlightItem,
  type KoreaAirportInfoItem,
} from './koreaAirports.ts'

const SCHEDULED = '2026-10-03T06:00:00+09:00'
const LATER = '2026-10-03T06:20:00+09:00'

Deno.test('결항과 사전결항은 cancelled 이다', () => {
  assertEquals(toKoreaAirportsKind('결항', SCHEDULED, SCHEDULED), 'cancelled')
  assertEquals(toKoreaAirportsKind('사전결항', SCHEDULED, SCHEDULED), 'cancelled')
})

Deno.test('회항은 diverted 이다', () => {
  assertEquals(toKoreaAirportsKind('회항', SCHEDULED, SCHEDULED), 'diverted')
})

Deno.test('지연이고 변경 시각이 예정 시각보다 늦으면 delayed 이다', () => {
  assertEquals(toKoreaAirportsKind('지연', SCHEDULED, LATER), 'delayed')
})

Deno.test('지연인데 변경 시각이 예정 시각과 같으면 scheduled 이다', () => {
  assertEquals(toKoreaAirportsKind('지연', SCHEDULED, SCHEDULED), 'scheduled')
})

Deno.test('출발은 departed 이다', () => {
  assertEquals(toKoreaAirportsKind('출발', SCHEDULED, LATER), 'departed')
})

Deno.test('수속·탑승 진행 상태는 scheduled 이다', () => {
  for (const remark of ['수속중', '마감예정', '탑승중', '탑승장 입장', '탑승마감', '탑승구 변경']) {
    assertEquals(toKoreaAirportsKind(remark, SCHEDULED, SCHEDULED), 'scheduled')
  }
})

Deno.test('상태가 비어 있으면 scheduled 이다', () => {
  assertEquals(toKoreaAirportsKind(null, SCHEDULED, null), 'scheduled')
})

Deno.test('조회 창은 출발 시각 전후를 시 단위로 넓히고 한국 시각 기준이다', () => {
  assertEquals(getKoreaAirportsWindow('2026-10-03T00:35:00Z'), {
    searchday: '20261003',
    departFrom: '0700',
    departTo: '1159',
    arrivalFrom: '0900',
    arrivalTo: '1459',
  })
})

Deno.test('조회 창은 자정을 넘지 않는다', () => {
  assertEquals(getKoreaAirportsWindow('2026-10-03T14:30:00Z'), {
    searchday: '20261003',
    departFrom: '2100',
    departTo: '2359',
    arrivalFrom: '2300',
    arrivalTo: '2359',
  })
})

Deno.test('마스터 편명이 빈 문자열이면 자기 편명으로 짝을 짓는다', () => {
  assertEquals(getMatchKey({ flightid: 'KE1114', masterflightid: '' }), 'KE1114')
  assertEquals(getMatchKey({ flightid: 'KE1114', masterflightid: ' ' }), 'KE1114')
})

Deno.test('마스터 편명이 있으면 그것으로 짝을 짓는다', () => {
  assertEquals(getMatchKey({ flightid: 'KE5153', masterflightid: 'LJ501' }), 'LJ501')
  assertEquals(getMatchKey({ flightid: 'KE1114', masterflightid: null }), 'KE1114')
})

function item(overrides: Partial<KoreaAirportFlightItem>): KoreaAirportFlightItem {
  return {
    flightid: 'LJ501',
    masterflightid: null,
    scheduledatetime: '202610030615',
    estimateddatetime: '202610030639',
    rmkKor: '지연',
    ...overrides,
  }
}

Deno.test('도착 목록에서 같은 편을 찾아 도착 시각을 담는다', () => {
  const observation = toObservation(item({}), [
    item({ flightid: 'ZE201', scheduledatetime: '202610030720', estimateddatetime: '202610030709', rmkKor: null }),
    item({ flightid: 'LJ501', scheduledatetime: '202610030730', estimateddatetime: '202610030745', rmkKor: null }),
  ], null)

  assertEquals(observation.arrivalScheduledAt, '2026-10-03T07:30:00+09:00')
  assertEquals(observation.arrivalEstimatedAt, '2026-10-03T07:45:00+09:00')
})

Deno.test('도착 목록에 없으면 도착 시각은 비운다', () => {
  const observation = toObservation(item({}), [item({ flightid: 'ZE201' })], null)

  assertEquals(observation.arrivalScheduledAt, null)
  assertEquals(observation.arrivalEstimatedAt, null)
})

Deno.test('코드셰어 편명도 마스터 편명으로 도착 목록의 짝을 찾는다', () => {
  const observation = toObservation(item({ flightid: 'KE5153', masterflightid: 'LJ501' }), [
    item({ flightid: 'LJ501', scheduledatetime: '202610030730', estimateddatetime: '202610030745', rmkKor: null }),
  ], null)

  assertEquals(observation.arrivalEstimatedAt, '2026-10-03T07:45:00+09:00')
})

Deno.test('도착 목록의 도착 상태이면 kind 가 arrived 가 된다', () => {
  const observation = toObservation(item({ rmkKor: '출발' }), [
    item({ scheduledatetime: '202610030730', estimateddatetime: '202610030745', rmkKor: '도착' }),
  ], null)

  assertEquals(observation.kind, 'arrived')
})

Deno.test('게이트를 못 찾으면 게이트와 터미널은 비어 있다', () => {
  const observation = toObservation(item({}), [], null)

  assertEquals(observation.gate, null)
  assertEquals(observation.terminal, null)
})

Deno.test('찾은 게이트를 관측값에 담는다', () => {
  const observation = toObservation(item({}), [], '23')

  assertEquals(observation.gate, '23')
  assertEquals(observation.terminal, null)
})

function info(overrides: Partial<KoreaAirportInfoItem>): KoreaAirportInfoItem {
  return { airFln: 'LJ501', std: '0615', gate: '13', ...overrides }
}

Deno.test('편명과 예정 시각이 같은 행의 게이트를 찾는다', () => {
  const infos = [info({ airFln: 'ZE201', std: '0605', gate: '12' }), info({})]

  assertEquals(findGate(infos, item({})), '13')
})

Deno.test('게이트가 빈 문자열이면 null 이다', () => {
  assertEquals(findGate([info({ gate: '' })], item({})), null)
  assertEquals(findGate([info({ gate: ' ' })], item({})), null)
})

Deno.test('게이트가 null 이면 null 이다', () => {
  assertEquals(findGate([info({ gate: null })], item({})), null)
})

Deno.test('같은 편명이라도 예정 시각이 다르면 찾지 않는다', () => {
  assertEquals(findGate([info({ std: '1815' })], item({})), null)
})

Deno.test('짝이 없으면 null 이다', () => {
  assertEquals(findGate([], item({})), null)
})
