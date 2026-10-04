import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push'
import { isExpoPushToken, sendExpoPush } from '../chat-web-push/expoPush.ts'

export interface PushDeliveryResult {
  attempted: number
  sent: number
  errors: string[]
}

export async function sendPushToRecipients(
  supabase: SupabaseClient,
  tripId: string,
  message: { title: string; body: string },
  data: Record<string, unknown>,
): Promise<PushDeliveryResult> {
  const { data: members } = await supabase.from('active_trip_members').select('user_id').eq('trip_id', tripId)
  const recipientIds = (members ?? []).map((m: { user_id: string }) => m.user_id)
  if (recipientIds.length === 0) return { attempted: 0, sent: 0, errors: [] }

  const { data: subscriptions } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, subscription')
    .in('user_id', recipientIds)
  if (subscriptions == null || subscriptions.length === 0) return { attempted: 0, sent: 0, errors: [] }

  type SubscriptionRow = { id: string; endpoint: string; subscription: unknown }
  const rows = subscriptions as SubscriptionRow[]
  const nativeRows = rows.filter((row) => isExpoPushToken(row.endpoint))
  const webRows = rows.filter((row) => !isExpoPushToken(row.endpoint))

  const payload = JSON.stringify({ title: message.title, body: message.body, ...data })

  const webResults = await Promise.allSettled(
    webRows.map((row) =>
      webpush.sendNotification(row.subscription as webpush.PushSubscription, payload).catch(async (err: { statusCode?: number; message?: string }) => {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await supabase.from('push_subscriptions').delete().eq('id', row.id)
        }
        throw err
      }),
    ),
  )

  const errors: string[] = []
  webResults.forEach((result, index) => {
    if (result.status !== 'rejected') return
    const reason = result.reason as { statusCode?: number; message?: string }
    const error = `webpush ${webRows[index].id}: HTTP ${reason.statusCode ?? '?'} ${reason.message ?? String(reason)}`
    console.error('dispatch-notifications push failed', error)
    errors.push(error)
  })
  const webSent = webResults.filter((result) => result.status === 'fulfilled').length

  const native =
    nativeRows.length > 0
      ? await sendExpoPush(
          nativeRows.map((row) => row.endpoint),
          { title: message.title, body: message.body, data },
        )
      : { sent: 0, invalidTokens: [] as string[] }

  if (native.invalidTokens.length > 0) {
    await supabase.from('push_subscriptions').delete().in('endpoint', native.invalidTokens)
  }

  const nativeFailedCount = nativeRows.length - native.sent
  if (nativeFailedCount > 0) {
    const error = `expo push: ${nativeFailedCount}/${nativeRows.length} 건 실패`
    console.error('dispatch-notifications push failed', error)
    errors.push(error)
  }

  return { attempted: webRows.length + nativeRows.length, sent: webSent + native.sent, errors }
}
