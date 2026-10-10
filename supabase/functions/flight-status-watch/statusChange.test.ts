import { assertEquals } from 'jsr:@std/assert@1'
import { getIsGateChanged, getShouldNotify, toNotificationText } from './statusChange.ts'

const notNotified = { lastNotifiedKind: null, lastNotifiedEstimatedAt: null, lastNotifiedGate: null }

Deno.test('탑승구가 빈 문자열이면 아직 배정 전이라 변경이 아니다', () => {
  assertEquals(getIsGateChanged({ kind: 'scheduled', estimatedAt: null, gate: '' }, '241', notNotified), false)
})

Deno.test('탑승구가 빈 문자열이면 알림을 보내지 않는다', () => {
  assertEquals(getShouldNotify({ kind: 'scheduled', estimatedAt: null, gate: '' }, '241', notNotified), false)
})

Deno.test('직전에 관측한 탑승구가 없으면 처음 배정이라 변경이 아니다', () => {
  assertEquals(getIsGateChanged({ kind: 'scheduled', estimatedAt: null, gate: '241' }, null, notNotified), false)
})

Deno.test('직전에 관측한 탑승구와 같으면 알린 적이 없어도 변경이 아니다', () => {
  assertEquals(getIsGateChanged({ kind: 'scheduled', estimatedAt: null, gate: '241' }, '241', notNotified), false)
})

Deno.test('시간대 표기만 다른 같은 지연 시각이면 다시 보내지 않는다', () => {
  assertEquals(
    getShouldNotify({ kind: 'delayed', estimatedAt: '2026-10-10T16:20:00+09:00', gate: null }, null, {
      lastNotifiedKind: 'delayed',
      lastNotifiedEstimatedAt: '2026-10-10T07:20:00+00:00',
      lastNotifiedGate: null,
    }),
    false,
  )
})

Deno.test('직전에 관측한 탑승구와 다르면 변경이다', () => {
  assertEquals(getIsGateChanged({ kind: 'scheduled', estimatedAt: null, gate: '242' }, '241', notNotified), true)
})

Deno.test('탑승구 번호의 읽는 소리에 맞춰 조사를 붙인다', () => {
  const { body } = toNotificationText(
    { airline: '대한항공', flightNumber: '011', arrivalCityName: '파리' },
    { kind: 'scheduled', estimatedAt: null, gate: '220' },
    true,
  )

  assertEquals(body, '탑승구가 220으로 변경됐어요.')
})
