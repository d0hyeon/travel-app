import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { assertEquals } from 'jsr:@std/assert@1'
import {
  dispatchDueNotifications,
  type DueNotification,
  type NotificationHandler,
  type RescheduledOutcome,
} from './dispatch.ts'

const NOW = new Date('2026-10-03T12:00:00Z')

const notification: DueNotification = {
  id: 'n1',
  type: 'boarding_reminder',
  subject_id: 'transport-1',
  attempt_count: 0,
}

function createFakeSupabase(due: DueNotification[], isClaimable = true) {
  const patches: Record<string, unknown>[] = []
  const filtersByPatch = new Map<Record<string, unknown>, [string, unknown][]>()

  const from = () => {
    let patch: Record<string, unknown> | null = null
    const filters: [string, unknown][] = []
    const builder: Record<string, unknown> = {
      update(value: Record<string, unknown>) {
        patch = value
        filtersByPatch.set(value, filters)
        return builder
      },
      select: () => builder,
      eq(column: string, value: unknown) {
        filters.push([column, value])
        return builder
      },
      in: () => builder,
      lte: () => builder,
      lt: () => builder,
      maybeSingle: () => {
        if (patch != null) patches.push(patch)
        return Promise.resolve({ data: isClaimable ? { id: notification.id } : null, error: null })
      },
      then(resolve: (value: unknown) => void) {
        if (patch == null) return resolve({ data: due, error: null })
        patches.push(patch)
        return resolve({ data: null, error: null })
      },
    }
    return builder
  }

  return { supabase: { from } as unknown as SupabaseClient, patches, filtersByPatch }
}

Deno.test('때가 된 알림을 종류에 맞는 핸들러로 보내고 완료로 기록한다', async () => {
  const { supabase, patches } = createFakeSupabase([notification])
  const handlers: Record<string, NotificationHandler> = { boarding_reminder: () => Promise.resolve('sent') }

  const result = await dispatchDueNotifications(supabase, handlers, NOW)

  assertEquals(result, { claimedCount: 1, sentCount: 1 })
  assertEquals(patches.map((patch) => patch.status).includes('delivered'), true)
})

Deno.test('보낼 게 없어 건너뛴 알림도 완료로 기록하되 보낸 수에는 세지 않는다', async () => {
  const { supabase, patches } = createFakeSupabase([notification])
  const handlers: Record<string, NotificationHandler> = { boarding_reminder: () => Promise.resolve('skipped') }

  const result = await dispatchDueNotifications(supabase, handlers, NOW)

  assertEquals(result, { claimedCount: 1, sentCount: 0 })
  assertEquals(patches.map((patch) => patch.status).includes('delivered'), true)
})

Deno.test('핸들러가 취소를 돌려주면 취소로 기록한다', async () => {
  const { supabase, patches } = createFakeSupabase([notification])
  const handlers: Record<string, NotificationHandler> = { boarding_reminder: () => Promise.resolve('cancelled') }

  await dispatchDueNotifications(supabase, handlers, NOW)

  assertEquals(patches.map((patch) => patch.status).includes('cancelled'), true)
})

Deno.test('핸들러가 던지면 재시도 대기로 돌려놓는다', async () => {
  const { supabase, patches } = createFakeSupabase([notification])
  const handlers: Record<string, NotificationHandler> = {
    boarding_reminder: () => Promise.reject(new Error('푸시 발송 전체 실패')),
  }

  await dispatchDueNotifications(supabase, handlers, NOW)

  const retry = patches.find((patch) => patch.attempt_count === 1)
  assertEquals(retry?.status, 'pending')
  assertEquals(retry?.last_error, '푸시 발송 전체 실패')
})

Deno.test('다른 곳에서 먼저 점유한 알림은 건너뛴다', async () => {
  const { supabase } = createFakeSupabase([notification], false)
  let called = false
  const handlers: Record<string, NotificationHandler> = {
    boarding_reminder: () => {
      called = true
      return Promise.resolve('sent')
    },
  }

  const result = await dispatchDueNotifications(supabase, handlers, NOW)

  assertEquals(result, { claimedCount: 0, sentCount: 0 })
  assertEquals(called, false)
})

const RESCHEDULED_FOR = new Date('2026-10-03T12:10:00Z')
const rescheduledOutcome: RescheduledOutcome = { rescheduledFor: RESCHEDULED_FOR }

Deno.test('재예약 결과면 작업을 대기 상태로 되돌리고 발송 시각을 바꾼다', async () => {
  const { supabase, patches } = createFakeSupabase([notification])
  const handlers: Record<string, NotificationHandler> = {
    boarding_reminder: () => Promise.resolve(rescheduledOutcome),
  }

  await dispatchDueNotifications(supabase, handlers, NOW)

  const rescheduled = patches.find((patch) => patch.scheduled_for === RESCHEDULED_FOR.toISOString())
  assertEquals(rescheduled?.status, 'pending')
  assertEquals(rescheduled?.locked_at, null)
})

Deno.test('재예약은 발송 수에 넣지 않는다', async () => {
  const { supabase } = createFakeSupabase([notification])
  const handlers: Record<string, NotificationHandler> = {
    boarding_reminder: () => Promise.resolve(rescheduledOutcome),
  }

  const result = await dispatchDueNotifications(supabase, handlers, NOW)

  assertEquals(result, { claimedCount: 1, sentCount: 0 })
})

Deno.test('재예약은 시도 횟수를 늘리지 않는다', async () => {
  const { supabase, patches } = createFakeSupabase([notification])
  const handlers: Record<string, NotificationHandler> = {
    boarding_reminder: () => Promise.resolve(rescheduledOutcome),
  }

  await dispatchDueNotifications(supabase, handlers, NOW)

  const rescheduled = patches.find((patch) => patch.scheduled_for === RESCHEDULED_FOR.toISOString())
  assertEquals(rescheduled != null, true)
  assertEquals(rescheduled != null && 'attempt_count' in rescheduled, false)
  assertEquals(rescheduled != null && 'last_error' in rescheduled, false)
})

Deno.test('재예약 결과는 완료(delivered)로 기록하지 않는다', async () => {
  const { supabase, patches } = createFakeSupabase([notification])
  const handlers: Record<string, NotificationHandler> = {
    boarding_reminder: () => Promise.resolve(rescheduledOutcome),
  }

  await dispatchDueNotifications(supabase, handlers, NOW)

  assertEquals(patches.map((patch) => patch.status).includes('delivered'), false)
})

Deno.test('완료·취소·재예약 갱신은 처리 중 상태인 작업에만 적용한다', async () => {
  const settlements = [
    { outcome: 'sent', isSettlement: (patch: Record<string, unknown>) => patch.status === 'delivered' },
    { outcome: 'cancelled', isSettlement: (patch: Record<string, unknown>) => patch.status === 'cancelled' },
    { outcome: rescheduledOutcome, isSettlement: (patch: Record<string, unknown>) => patch.scheduled_for != null },
  ] as const

  for (const { outcome, isSettlement } of settlements) {
    const { supabase, patches, filtersByPatch } = createFakeSupabase([notification])
    const handlers: Record<string, NotificationHandler> = { boarding_reminder: () => Promise.resolve(outcome) }

    await dispatchDueNotifications(supabase, handlers, NOW)

    const settlement = patches.find(isSettlement)
    assertEquals(settlement == null ? null : filtersByPatch.get(settlement), [
      ['id', notification.id],
      ['status', 'processing'],
    ])
  }
})

Deno.test('실패 재시도 갱신도 처리 중 상태인 작업에만 적용한다', async () => {
  const { supabase, patches, filtersByPatch } = createFakeSupabase([notification])
  const handlers: Record<string, NotificationHandler> = {
    boarding_reminder: () => Promise.reject(new Error('푸시 발송 전체 실패')),
  }

  await dispatchDueNotifications(supabase, handlers, NOW)

  const retry = patches.find((patch) => patch.attempt_count === 1)
  assertEquals(retry == null ? null : filtersByPatch.get(retry), [
    ['id', notification.id],
    ['status', 'processing'],
  ])
})
