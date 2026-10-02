import { assertEquals } from 'jsr:@std/assert@1'
import { getIsWithinNotifyWindow, getObserveRange } from './watchWindow.ts'

const now = new Date('2026-10-03T09:00:00Z')

Deno.test('관측 범위는 출발 6시간 후부터 7일 전까지다', () => {
  const { from, until } = getObserveRange(now)

  assertEquals(from.toISOString(), '2026-10-03T03:00:00.000Z')
  assertEquals(until.toISOString(), '2026-10-10T09:00:00.000Z')
})

Deno.test('알림 범위는 아직 출발하지 않았고 24시간 안이면 참이다', () => {
  assertEquals(getIsWithinNotifyWindow('2026-10-04T03:00:00Z', now, 24), true)
})

Deno.test('출발이 24시간보다 멀면 알림 범위 밖이다', () => {
  assertEquals(getIsWithinNotifyWindow('2026-10-04T09:00:01Z', now, 24), false)
})

Deno.test('이미 출발했으면 알림 범위 밖이다', () => {
  assertEquals(getIsWithinNotifyWindow('2026-10-03T08:59:59Z', now, 24), false)
})

Deno.test('경계(정확히 24시간 후)는 범위 안이다', () => {
  assertEquals(getIsWithinNotifyWindow('2026-10-04T09:00:00Z', now, 24), true)
})
