import { assertEquals } from 'jsr:@std/assert@1'
import { nextNoticeState, toNotifiedStatus } from './noticeState.ts'

Deno.test('기록이 없으면 알린 적이 없는 상태로 본다', () => {
  assertEquals(toNotifiedStatus(undefined), {
    lastNotifiedKind: null,
    lastNotifiedEstimatedAt: null,
    lastNotifiedGate: null,
  })
})

Deno.test('기록이 있으면 그 값을 알린 상태로 본다', () => {
  assertEquals(
    toNotifiedStatus({
      transport_id: 't1',
      last_notified_kind: 'delayed',
      last_notified_estimated_at: '2026-10-05T01:40:00+00:00',
      last_notified_gate: '23',
    }),
    {
      lastNotifiedKind: 'delayed',
      lastNotifiedEstimatedAt: '2026-10-05T01:40:00+00:00',
      lastNotifiedGate: '23',
    },
  )
})

Deno.test('빈 문자열 게이트는 알린 적이 없는 것으로 본다', () => {
  assertEquals(
    toNotifiedStatus({
      transport_id: 't1',
      last_notified_kind: null,
      last_notified_estimated_at: null,
      last_notified_gate: '',
    }).lastNotifiedGate,
    null,
  )
})

Deno.test('알림을 판단했으면 현재 상태를 알린 상태로 남긴다', () => {
  assertEquals(nextNoticeState({ kind: 'cancelled', estimatedAt: null, gate: '24' }), {
    lastNotifiedKind: 'cancelled',
    lastNotifiedEstimatedAt: null,
    lastNotifiedGate: '24',
  })
})
