import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

webpush.setVapidDetails(
  Deno.env.get('VAPID_SUBJECT')!,
  Deno.env.get('VAPID_PUBLIC_KEY')!,
  Deno.env.get('VAPID_PRIVATE_KEY')!,
)

Deno.serve(async (req) => {
  const { tripId, senderId, title, body } = await req.json()

  // 여행 멤버 중 발신자를 제외한 user_id 목록
  const { data: members, error: memberError } = await supabase
    .from('trip_members')
    .select('user_id')
    .eq('trip_id', tripId)
    .neq('user_id', senderId)

  if (memberError) {
    return Response.json({ error: memberError.message }, { status: 500 })
  }

  const recipientIds = members.map((m: { user_id: string }) => m.user_id)
  if (recipientIds.length === 0) {
    return Response.json({ success: true, sent: 0 })
  }

  const { data: subscriptions, error: subError } = await supabase
    .from('push_subscriptions')
    .select('id, subscription')
    .in('user_id', recipientIds)

  if (subError) {
    return Response.json({ error: subError.message }, { status: 500 })
  }

  const payload = JSON.stringify({ title, body, tripId })

  const results = await Promise.allSettled(
    subscriptions.map((row: { id: string; subscription: unknown }) =>
      webpush.sendNotification(row.subscription as webpush.PushSubscription, payload)
    ),
  )

  return Response.json({
    success: true,
    sent: results.filter((r: PromiseSettledResult<unknown>) => r.status === 'fulfilled').length,
  })
})
