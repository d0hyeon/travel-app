import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push'
import { dispatchDueNotifications, type NotificationHandler } from './dispatch.ts'
import { handleAirportArrivalGuidance } from './handlers/airportArrivalGuidance.ts'
import { handleBoardingReminder } from './handlers/boardingReminder.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

webpush.setVapidDetails(
  Deno.env.get('VAPID_SUBJECT')!,
  Deno.env.get('VAPID_PUBLIC_KEY')!,
  Deno.env.get('VAPID_PRIVATE_KEY')!,
)

const handlers: Record<string, NotificationHandler> = {
  airport_arrival_guidance: handleAirportArrivalGuidance,
  boarding_reminder: handleBoardingReminder,
}

function isServiceRoleRequest(req: Request): boolean {
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  return serviceRoleKey != null && req.headers.get('authorization') === `Bearer ${serviceRoleKey}`
}

Deno.serve(async (req) => {
  if (!isServiceRoleRequest(req)) {
    return Response.json({ error: '권한이 없습니다.' }, { status: 403 })
  }

  try {
    const { now } = (await req.json()) as { now?: string }
    const result = await dispatchDueNotifications(supabase, handlers, now == null ? new Date() : new Date(now))
    return Response.json(result)
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 })
  }
})
