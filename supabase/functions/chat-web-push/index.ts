import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push'
import { isExpoPushToken, sendExpoPush } from './expoPush.ts'

// 이름은 web 이지만 웹과 앱 양쪽에 보낸다.
// 배포된 함수라 URL 이 바뀌면 호출부가 깨지므로 이름을 유지한다.

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

webpush.setVapidDetails(
  Deno.env.get('VAPID_SUBJECT')!,
  Deno.env.get('VAPID_PUBLIC_KEY')!,
  Deno.env.get('VAPID_PRIVATE_KEY')!,
)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const { tripId, senderId, body } = await req.json()

  const { data: trip } = await supabase
    .from('trips')
    .select('name')
    .eq('id', tripId)
    .single()

  const title = trip?.name ?? '여행'

  // 여행 멤버 중 발신자를 제외한 user_id 목록
  const { data: members, error: memberError } = await supabase
    .from('trip_members')
    .select('user_id')
    .eq('trip_id', tripId)
    .neq('user_id', senderId)

  if (memberError) {
    return Response.json({ error: memberError.message }, { status: 500, headers: corsHeaders })
  }

  const recipientIds = members.map((m: { user_id: string }) => m.user_id)
  if (recipientIds.length === 0) {
    return Response.json({ success: true, sent: 0 }, { headers: corsHeaders })
  }

  const { data: subscriptions, error: subError } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, subscription')
    .in('user_id', recipientIds)

  if (subError) {
    return Response.json({ error: subError.message }, { status: 500, headers: corsHeaders })
  }

  // 웹은 VAPID 로 브라우저 push service 에, 앱은 Expo 로 APNs·FCM 에 보낸다.
  // 보내는 경로만 다르고 받는 사람은 같으므로 여기서 가른다.
  type SubscriptionRow = { id: string; endpoint: string; subscription: unknown }
  const nativeRows = (subscriptions as SubscriptionRow[]).filter((row) => isExpoPushToken(row.endpoint))
  const webRows = (subscriptions as SubscriptionRow[]).filter((row) => !isExpoPushToken(row.endpoint))

  const payload = JSON.stringify({ title, body, tripId })

  try {
    const results = await Promise.allSettled(
      webRows.map((row) =>
        webpush.sendNotification(row.subscription as webpush.PushSubscription, payload)
          .catch(async (err: { statusCode?: number }) => {
            if (err.statusCode === 410 || err.statusCode === 404) {
              await supabase.from('push_subscriptions').delete().eq('id', row.id)
            }
            throw err
          })
      ),
    )

    const failed = (results as PromiseSettledResult<unknown>[]).filter((r): r is PromiseRejectedResult => r.status === 'rejected')
    if (failed.length > 0) {
      console.error('Push send errors:', JSON.stringify(failed.map((r: PromiseRejectedResult) => String(r.reason))))
    }

    const native = nativeRows.length > 0
      ? await sendExpoPush(nativeRows.map((row) => row.endpoint), {
          title,
          body,
          data: { tripId },
        })
      : { sent: 0, invalidTokens: [] }

    if (native.invalidTokens.length > 0) {
      await supabase.from('push_subscriptions').delete().in('endpoint', native.invalidTokens)
    }

    return Response.json({
      success: true,
      sent: results.length - failed.length + native.sent,
      failed: failed.length,
    }, { headers: corsHeaders })
  } catch (err) {
    console.error('Unexpected error:', String(err))
    return Response.json({ error: String(err) }, { status: 500, headers: corsHeaders })
  }
})
