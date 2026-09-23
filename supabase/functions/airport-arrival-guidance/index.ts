import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push'
import { isExpoPushToken, sendExpoPush } from '../chat-web-push/expoPush.ts'
import { getCongestionSnapshotData, getFreshCongestionSnapshot } from './congestion.ts'
import {
  getAirportArrivalGuidance,
  getConsistentDepartureTerminal,
  getRecommendedDepartureGate,
  type AirportArrivalGuidance,
} from './guidance.ts'
import { markScheduledNotificationJobFailed } from './jobState.ts'
import { toAirportArrivalPushMessage } from './push.ts'
import type {
  AirportArrivalGuidanceFunctionRequest,
  AirportArrivalGuidanceFunctionResponse,
} from './types.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

webpush.setVapidDetails(
  Deno.env.get('VAPID_SUBJECT')!,
  Deno.env.get('VAPID_PUBLIC_KEY')!,
  Deno.env.get('VAPID_PRIVATE_KEY')!,
)

interface DueJobRow {
  id: string
  trip_transport_id: string
  attempt_count: number
}

interface TransportRow {
  id: string
  trip_id: string
  type: string
  departure_at: string
  departure_airport_code: string | null
}

interface FlightStatusRow {
  kind: string | null
  estimated_at: string | null
}

interface TicketRow {
  terminal: string | null
}

interface TripRow {
  is_overseas: boolean
}

function getKoreaDateValue(date: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const valueByType = new Map(parts.map((part) => [part.type, part.value]))
  return Date.UTC(
    Number(valueByType.get('year')),
    Number(valueByType.get('month')) - 1,
    Number(valueByType.get('day')),
  )
}

function getForecastDateOffset(departureAt: string, now: Date): '0' | '1' | null {
  const daysUntilDeparture = (getKoreaDateValue(new Date(departureAt)) - getKoreaDateValue(now)) / 86_400_000
  if (daysUntilDeparture === 0) return '0'
  if (daysUntilDeparture === 1) return '1'
  return null
}

async function getGuidanceForTransport(input: {
  tripId: string
  transportId: string
  now: Date
}): Promise<AirportArrivalGuidance | null> {
  const { data: transport } = await supabase
    .from('trip_transports')
    .select('id, trip_id, type, departure_at, departure_airport_code')
    .eq('id', input.transportId)
    .eq('trip_id', input.tripId)
    .maybeSingle()

  if (transport == null) return null
  const typedTransport = transport as TransportRow
  if (typedTransport.type !== 'flight' || typedTransport.departure_airport_code == null) return null

  const [{ data: flightStatus }, { data: tickets }, { data: trip }, policy] = await Promise.all([
    supabase
      .from('trip_transport_flight_status')
      .select('kind, estimated_at')
      .eq('transport_id', typedTransport.id)
      .maybeSingle(),
    supabase.from('trip_transport_tickets').select('terminal').eq('transport_id', typedTransport.id),
    supabase.from('trips').select('is_overseas').eq('id', input.tripId).maybeSingle(),
    getActivePolicy(),
  ])

  const terminal = getConsistentDepartureTerminal((tickets ?? []) as TicketRow[])
  const typedFlightStatus = flightStatus as FlightStatusRow | null
  const typedTrip = trip as TripRow | null
  const isOverseas = typedTrip?.is_overseas ?? false
  const isCancelled = typedFlightStatus?.kind === 'cancelled'
  const appliedDepartureAt = typedFlightStatus?.estimated_at ?? typedTransport.departure_at

  if (terminal == null || isCancelled) return null

  const forecastDate = isOverseas ? getForecastDateOffset(appliedDepartureAt, input.now) : undefined
  if (isOverseas && forecastDate == null) return null

  const serviceKey = Deno.env.get('DATA_GO_SERVICE_KEY')
  if (serviceKey == null) throw new Error('DATA_GO_SERVICE_KEY 가 없습니다.')

  const { snapshotId } = await getFreshCongestionSnapshot(supabase, serviceKey, {
    sourceKind: isOverseas ? 'forecast' : 'domestic',
    airportCode: typedTransport.departure_airport_code,
    terminal,
    forecastDate,
  })
  const snapshot = await getCongestionSnapshotData(supabase, snapshotId)

  const guidance = getAirportArrivalGuidance({
    departureAt: typedTransport.departure_at,
    estimatedDepartureAt: typedFlightStatus?.estimated_at ?? undefined,
    isCancelled,
    isOverseas,
    departureTerminal: terminal,
    now: input.now.toISOString(),
    policy,
    snapshot,
  })
  if (guidance == null || !isOverseas) return guidance

  const { snapshotId: realtimeSnapshotId } = await getFreshCongestionSnapshot(supabase, serviceKey, {
    sourceKind: 'realtime',
    airportCode: typedTransport.departure_airport_code,
    terminal,
  })
  const realtimeSnapshot = await getCongestionSnapshotData(supabase, realtimeSnapshotId)

  return {
    ...guidance,
    recommendedDepartureGate: getRecommendedDepartureGate({
      recommendedArrivalAt: guidance.recommendedArrivalAt,
      now: input.now.toISOString(),
      realtimeSnapshot,
    }),
  }
}

async function claimJob(jobId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('scheduled_notification_jobs')
    .update({ status: 'processing', locked_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', jobId)
    .eq('status', 'pending')
    .select('id')
    .maybeSingle()

  return error == null && data != null
}

async function cancelJob(jobId: string) {
  await supabase
    .from('scheduled_notification_jobs')
    .update({ status: 'cancelled', cancelled_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', jobId)
}

async function markJobDelivered(jobId: string) {
  await supabase
    .from('scheduled_notification_jobs')
    .update({ status: 'delivered', delivered_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', jobId)
}

async function markJobFailedOrRetry(jobId: string, attemptCount: number, error: unknown, now: Date) {
  const outcome = markScheduledNotificationJobFailed({ attemptCount }, now)

  await supabase
    .from('scheduled_notification_jobs')
    .update({
      status: outcome.status,
      attempt_count: outcome.attemptCount,
      last_error: (error as Error)?.message ?? String(error),
      scheduled_for: outcome.scheduledFor,
      locked_at: null,
      updated_at: now.toISOString(),
    })
    .eq('id', jobId)
}

async function sendPushToRecipients(
  supabase: SupabaseClient,
  tripId: string,
  message: { title: string; body: string },
  data: Record<string, unknown>,
): Promise<number> {
  const { data: members } = await supabase.from('trip_members').select('user_id').eq('trip_id', tripId)
  const recipientIds = (members ?? []).map((m: { user_id: string }) => m.user_id)
  if (recipientIds.length === 0) return 0

  const { data: subscriptions } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, subscription')
    .in('user_id', recipientIds)
  if (subscriptions == null || subscriptions.length === 0) return 0

  type SubscriptionRow = { id: string; endpoint: string; subscription: unknown }
  const rows = subscriptions as SubscriptionRow[]
  const nativeRows = rows.filter((row) => isExpoPushToken(row.endpoint))
  const webRows = rows.filter((row) => !isExpoPushToken(row.endpoint))

  const payload = JSON.stringify({ title: message.title, body: message.body, ...data })

  const webResults = await Promise.allSettled(
    webRows.map((row) =>
      webpush.sendNotification(row.subscription as webpush.PushSubscription, payload).catch(async (err: { statusCode?: number }) => {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await supabase.from('push_subscriptions').delete().eq('id', row.id)
        }
        throw err
      }),
    ),
  )
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

  return webSent + native.sent
}

async function processJob(job: DueJobRow, now: Date): Promise<'delivered' | 'skipped'> {
  const { data: transport } = await supabase
    .from('trip_transports')
    .select('id, trip_id, type, departure_at, departure_airport_code')
    .eq('id', job.trip_transport_id)
    .maybeSingle()

  if (transport == null) {
    await cancelJob(job.id)
    return 'skipped'
  }
  const typedTransport = transport as TransportRow
  const guidance = await getGuidanceForTransport({
    tripId: typedTransport.trip_id,
    transportId: typedTransport.id,
    now,
  })

  if (guidance == null) {
    await markJobDelivered(job.id)
    return 'skipped'
  }

  const message = toAirportArrivalPushMessage(guidance)
  const sent = await sendPushToRecipients(supabase, typedTransport.trip_id, message, {
    tripId: typedTransport.trip_id,
    transportId: typedTransport.id,
  })

  await markJobDelivered(job.id)
  return sent > 0 ? 'delivered' : 'skipped'
}

interface PolicyRow {
  domestic_base_buffer_minutes: number
  international_base_buffer_minutes: number
  calm_max_ratio: number
  normal_max_ratio: number
  crowded_max_ratio: number
  calm_extra_minutes: number
  normal_extra_minutes: number
  crowded_extra_minutes: number
  very_crowded_extra_minutes: number
}

async function getActivePolicy() {
  const { data, error } = await supabase
    .from('airport_arrival_guidance_policies')
    .select(
      'domestic_base_buffer_minutes, international_base_buffer_minutes, calm_max_ratio, normal_max_ratio, crowded_max_ratio, calm_extra_minutes, normal_extra_minutes, crowded_extra_minutes, very_crowded_extra_minutes',
    )
    .eq('is_active', true)
    .single()

  if (error != null || data == null) {
    throw new Error('활성 공항 도착 안내 정책이 없습니다.')
  }

  const policy = data as PolicyRow
  return {
    domesticBaseBufferMinutes: policy.domestic_base_buffer_minutes,
    internationalBaseBufferMinutes: policy.international_base_buffer_minutes,
    calmMaxRatio: policy.calm_max_ratio,
    normalMaxRatio: policy.normal_max_ratio,
    crowdedMaxRatio: policy.crowded_max_ratio,
    calmExtraMinutes: policy.calm_extra_minutes,
    normalExtraMinutes: policy.normal_extra_minutes,
    crowdedExtraMinutes: policy.crowded_extra_minutes,
    veryCrowdedExtraMinutes: policy.very_crowded_extra_minutes,
  }
}

async function deliverDueJobs(now: Date) {
  const staleLockCutoff = new Date(now.getTime() - 30 * 60 * 1000).toISOString()
  await supabase
    .from('scheduled_notification_jobs')
    .update({ status: 'pending', locked_at: null, updated_at: now.toISOString() })
    .eq('status', 'processing')
    .lt('locked_at', staleLockCutoff)

  const { data: dueJobs } = await supabase
    .from('scheduled_notification_jobs')
    .select('id, trip_transport_id, attempt_count')
    .eq('status', 'pending')
    .eq('type', 'airport_arrival_guidance')
    .lte('scheduled_for', now.toISOString())

  let claimedJobCount = 0
  let deliveredJobCount = 0

  for (const job of (dueJobs ?? []) as DueJobRow[]) {
    const claimed = await claimJob(job.id)
    if (!claimed) continue

    claimedJobCount += 1

    try {
      const result = await processJob(job, now)
      if (result === 'delivered') deliveredJobCount += 1
    } catch (error) {
      await markJobFailedOrRetry(job.id, job.attempt_count, error, now)
    }
  }

  return { claimedJobCount, deliveredJobCount }
}

export async function handleAirportArrivalGuidance(
  request: AirportArrivalGuidanceFunctionRequest,
): Promise<AirportArrivalGuidanceFunctionResponse> {
  if (request.action === 'get-guidance') {
    const guidance = await getGuidanceForTransport({
      tripId: request.tripId,
      transportId: request.transportId,
      now: new Date(),
    })
    return { action: 'get-guidance', guidance }
  }

  const result = await deliverDueJobs(new Date(request.now))
  return { action: 'deliver-due-jobs', ...result }
}

async function canReadTripGuidance(userId: string, tripId: string): Promise<boolean> {
  const { data } = await supabase
    .from('trip_members')
    .select('trip_id')
    .eq('trip_id', tripId)
    .eq('user_id', userId)
    .maybeSingle()
  return data != null
}

async function getAuthenticatedUserId(req: Request): Promise<string | null> {
  const authorization = req.headers.get('authorization')
  if (authorization == null || !authorization.startsWith('Bearer ')) return null

  const { data, error } = await supabase.auth.getUser(authorization.slice('Bearer '.length))
  if (error != null || data.user == null) return null
  return data.user.id
}

function isServiceRoleRequest(req: Request): boolean {
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  return serviceRoleKey != null && req.headers.get('authorization') === `Bearer ${serviceRoleKey}`
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const request = (await req.json()) as AirportArrivalGuidanceFunctionRequest
    if (request.action === 'get-guidance') {
      const userId = await getAuthenticatedUserId(req)
      const isTripMember = userId != null && (await canReadTripGuidance(userId, request.tripId))
      if (!isTripMember) {
        return Response.json({ error: '권한이 없습니다.' }, { status: 403, headers: corsHeaders })
      }
    } else if (!isServiceRoleRequest(req)) {
      return Response.json({ error: '권한이 없습니다.' }, { status: 403, headers: corsHeaders })
    }

    const result = await handleAirportArrivalGuidance(request)
    return Response.json(result, { headers: corsHeaders })
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500, headers: corsHeaders })
  }
})
