import { assertEquals } from 'jsr:@std/assert@1'
import { claimScheduledNotificationJob, markScheduledNotificationJobFailed } from './jobState.ts'

Deno.test('pending 상태인 작업만 점유할 수 있다', () => {
  assertEquals(claimScheduledNotificationJob({ status: 'pending' }), true)
  assertEquals(claimScheduledNotificationJob({ status: 'processing' }), false)
  assertEquals(claimScheduledNotificationJob({ status: 'delivered' }), false)
})

Deno.test('첫 번째 실패는 5분 뒤로 재시도한다', () => {
  const now = new Date('2026-09-23T00:00:00+09:00')
  const outcome = markScheduledNotificationJobFailed({ attemptCount: 0 }, now)

  assertEquals(outcome.status, 'pending')
  assertEquals(outcome.attemptCount, 1)
  assertEquals(outcome.scheduledFor, new Date('2026-09-23T00:05:00+09:00').toISOString())
})

Deno.test('두 번째 실패는 15분 뒤로 재시도한다', () => {
  const now = new Date('2026-09-23T00:00:00+09:00')
  const outcome = markScheduledNotificationJobFailed({ attemptCount: 1 }, now)

  assertEquals(outcome.status, 'pending')
  assertEquals(outcome.attemptCount, 2)
  assertEquals(outcome.scheduledFor, new Date('2026-09-23T00:15:00+09:00').toISOString())
})

Deno.test('세 번째 실패는 30분 뒤로 재시도한다', () => {
  const now = new Date('2026-09-23T00:00:00+09:00')
  const outcome = markScheduledNotificationJobFailed({ attemptCount: 2 }, now)

  assertEquals(outcome.status, 'pending')
  assertEquals(outcome.attemptCount, 3)
  assertEquals(outcome.scheduledFor, new Date('2026-09-23T00:30:00+09:00').toISOString())
})

Deno.test('세 번째 재시도 뒤의 네 번째 실패는 failed 로 끝낸다', () => {
  const now = new Date('2026-09-23T00:00:00+09:00')
  const outcome = markScheduledNotificationJobFailed({ attemptCount: 3 }, now)

  assertEquals(outcome.status, 'failed')
  assertEquals(outcome.attemptCount, 3)
  assertEquals(outcome.scheduledFor, undefined)
})
