import { assertEquals } from 'jsr:@std/assert@1'
import { getIsGateChanged, getShouldNotify } from './statusChange.ts'

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

Deno.test('직전에 관측한 탑승구와 다르면 변경이다', () => {
  assertEquals(getIsGateChanged({ kind: 'scheduled', estimatedAt: null, gate: '242' }, '241', notNotified), true)
})
