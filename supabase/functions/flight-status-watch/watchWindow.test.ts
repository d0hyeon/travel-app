import { assertEquals } from 'jsr:@std/assert@1'
import {
  getIsObserveDue,
  getIsWithinNotifyWindow,
  getObserveIntervalMinutes,
  getObserveRange,
} from './watchWindow.ts'

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

Deno.test('출발 3시간 이내는 5분마다 관측한다', () => {
  assertEquals(getObserveIntervalMinutes('2026-10-03T11:30:00Z', now), 5)
  assertEquals(getObserveIntervalMinutes('2026-10-03T12:00:00Z', now), 5)
})

Deno.test('출발 3시간에서 24시간 전은 15분마다 관측한다', () => {
  assertEquals(getObserveIntervalMinutes('2026-10-03T12:00:01Z', now), 15)
  assertEquals(getObserveIntervalMinutes('2026-10-04T09:00:00Z', now), 15)
})

Deno.test('출발이 24시간보다 멀면 3시간마다 관측한다', () => {
  assertEquals(getObserveIntervalMinutes('2026-10-04T09:00:01Z', now), 180)
})

Deno.test('이미 출발한 편은 도착을 확인하려고 15분마다 관측한다', () => {
  assertEquals(getObserveIntervalMinutes('2026-10-03T08:00:00Z', now), 15)
})

Deno.test('관측 주기에 해당하는 시각에만 관측할 차례다', () => {
  const far = '2026-10-08T09:00:00Z'

  assertEquals(getIsObserveDue(far, new Date('2026-10-03T09:00:00Z')), true)
  assertEquals(getIsObserveDue(far, new Date('2026-10-03T09:04:00Z')), true)
  assertEquals(getIsObserveDue(far, new Date('2026-10-03T09:05:00Z')), false)
  assertEquals(getIsObserveDue(far, new Date('2026-10-03T10:00:00Z')), false)
  assertEquals(getIsObserveDue(far, new Date('2026-10-03T12:00:00Z')), true)
})

Deno.test('15분 주기는 매시 0·15·30·45분에 관측한다', () => {
  const day = '2026-10-04T05:00:00Z'

  assertEquals(getIsObserveDue(day, new Date('2026-10-03T09:15:00Z')), true)
  assertEquals(getIsObserveDue(day, new Date('2026-10-03T09:20:00Z')), false)
})
