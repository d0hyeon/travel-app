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
    .select('id, subscription')
    .in('user_id', recipientIds)

  if (subError) {
    return Response.json({ error: subError.message }, { status: 500, headers: corsHeaders })
  }

  const payload = JSON.stringify({ title, body, tripId })

  try {
    const results = await Promise.allSettled(
      subscriptions.map((row: { id: string; subscription: unknown }) =>
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

    return Response.json({
      success: true,
      sent: results.length - failed.length,
      failed: failed.length,
    }, { headers: corsHeaders })
  } catch (err) {
    console.error('Unexpected error:', String(err))
    return Response.json({ error: String(err) }, { status: 500, headers: corsHeaders })
  }
})
