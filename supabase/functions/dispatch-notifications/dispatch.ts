import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { markScheduledNotificationJobFailed } from './jobState.ts'

const TABLE = 'scheduled_notifications'
const STALE_LOCK_MS = 30 * 60 * 1000

export interface DueNotification {
  id: string
  type: string
  trip_id: string
  subject_id: string
  attempt_count: number
}

export type NotificationOutcome = 'sent' | 'skipped' | 'cancelled'

export interface NotificationHandlerContext {
  supabase: SupabaseClient
  now: Date
}

export type NotificationHandler = (
  notification: DueNotification,
  context: NotificationHandlerContext,
) => Promise<NotificationOutcome>

async function claim(supabase: SupabaseClient, id: string): Promise<boolean> {
  const { data, error } = await supabase
    .from(TABLE)
    .update({ status: 'processing', locked_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('status', 'pending')
    .select('id')
    .maybeSingle()

  return error == null && data != null
}

async function markCancelled(supabase: SupabaseClient, id: string) {
  await supabase
    .from(TABLE)
    .update({ status: 'cancelled', cancelled_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', id)
}

async function markDelivered(supabase: SupabaseClient, id: string) {
  await supabase
    .from(TABLE)
    .update({ status: 'delivered', delivered_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', id)
}

async function markFailedOrRetry(
  supabase: SupabaseClient,
  notification: DueNotification,
  error: unknown,
  now: Date,
) {
  const outcome = markScheduledNotificationJobFailed({ attemptCount: notification.attempt_count }, now)

  await supabase
    .from(TABLE)
    .update({
      status: outcome.status,
      attempt_count: outcome.attemptCount,
      last_error: (error as Error)?.message ?? String(error),
      scheduled_for: outcome.scheduledFor,
      locked_at: null,
      updated_at: now.toISOString(),
    })
    .eq('id', notification.id)
}

export async function dispatchDueNotifications(
  supabase: SupabaseClient,
  handlers: Record<string, NotificationHandler>,
  now: Date,
) {
  await supabase
    .from(TABLE)
    .update({ status: 'pending', locked_at: null, updated_at: now.toISOString() })
    .eq('status', 'processing')
    .lt('locked_at', new Date(now.getTime() - STALE_LOCK_MS).toISOString())

  const { data: dueNotifications } = await supabase
    .from(TABLE)
    .select('id, type, trip_id, subject_id, attempt_count')
    .eq('status', 'pending')
    .in('type', Object.keys(handlers))
    .lte('scheduled_for', now.toISOString())

  let claimedCount = 0
  let sentCount = 0

  for (const notification of (dueNotifications ?? []) as DueNotification[]) {
    if (!(await claim(supabase, notification.id))) continue

    claimedCount += 1

    try {
      const outcome = await handlers[notification.type](notification, { supabase, now })

      if (outcome === 'cancelled') {
        await markCancelled(supabase, notification.id)
        continue
      }

      await markDelivered(supabase, notification.id)
      if (outcome === 'sent') sentCount += 1
    } catch (error) {
      await markFailedOrRetry(supabase, notification, error, now)
    }
  }

  return { claimedCount, sentCount }
}
