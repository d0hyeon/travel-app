import { assertEquals } from 'jsr:@std/assert@1'
import { getIsGateChanged, getShouldNotify } from './statusChange.ts'

const notNotified = { lastNotifiedKind: null, lastNotifiedEstimatedAt: null, lastNotifiedGate: null }

Deno.test('탑승구가 빈 문자열이면 아직 배정 전이라 변경이 아니다', () => {
  assertEquals(getIsGateChanged({ kind: 'scheduled', estimatedAt: null, gate: '' }, notNotified), false)
})

Deno.test('탑승구가 빈 문자열이면 알림을 보내지 않는다', () => {
  assertEquals(getShouldNotify({ kind: 'scheduled', estimatedAt: null, gate: '' }, notNotified), false)
})

Deno.test('탑승구가 처음 배정되면 변경으로 본다', () => {
  assertEquals(getIsGateChanged({ kind: 'scheduled', estimatedAt: null, gate: '241' }, notNotified), true)
})
