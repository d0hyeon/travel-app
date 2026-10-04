import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { assertEquals } from 'jsr:@std/assert@1'
import { dispatchDueNotifications, type DueNotification, type NotificationHandler } from './dispatch.ts'

const NOW = new Date('2026-10-03T12:00:00Z')

const notification: DueNotification = {
  id: 'n1',
  type: 'boarding_reminder',
  subject_id: 'transport-1',
  attempt_count: 0,
}

function createFakeSupabase(due: DueNotification[], isClaimable = true) {
  const patches: Record<string, unknown>[] = []

  const from = () => {
    let patch: Record<string, unknown> | null = null
    const builder: Record<string, unknown> = {
      update(value: Record<string, unknown>) {
        patch = value
        return builder
      },
      select: () => builder,
      eq: () => builder,
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

  return { supabase: { from } as unknown as SupabaseClient, patches }
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
