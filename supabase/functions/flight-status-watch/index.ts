import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push'
import { getAirportCityName } from '../airport-arrival-guidance/airports.ts'
import { isExpoPushToken, sendExpoPush } from '../chat-web-push/expoPush.ts'
import type { FlightObservation } from './flightObservation.ts'
import {
  getIncheonDepartures,
  getIsSameKstDate,
  isSameFlight,
  toIncheonObservation,
  toIsoFromApiDateTime,
  type IncheonFlightItem,
} from './incheonFlights.ts'
import { nextNoticeState, toNotifiedStatus, type NoticeRow } from './noticeState.ts'
import { KOREA_AIRPORT_CODES, getIsKoreaAirport, observeKoreaAirportsFlights } from './koreaAirports.ts'
import {
  getIsGateChanged,
  getShouldNotify,
  toNotificationText,
  type WatchedStatus,
} from './statusChange.ts'
import {
  getIsObserveDue,
  getIsWithinNotifyWindow,
  getObserveRange,
  NOTIFY_BEFORE_DEPARTURE_HOURS,
} from './watchWindow.ts'

// pg_cron 이 5분마다 부른다. 사용자마다 job 을 만들지 않는다 --
// 교통편을 등록하면 관측 범위에 들어오고 출발 6시간 뒤에 빠진다.
// 관측값은 범위 전체를 저장하고, 알림은 출발 24시간 안의 편에만 판단한다.

const INCHEON = 'ICN'

// 인천공항이 D+6 까지 주므로 테스트 모드는 그 끝까지 본다.
const TEST_WINDOW_HOURS = 24 * 7

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

webpush.setVapidDetails(
  Deno.env.get('VAPID_SUBJECT')!,
  Deno.env.get('VAPID_PUBLIC_KEY')!,
  Deno.env.get('VAPID_PRIVATE_KEY')!,
)

interface TransportRow {
  id: string
  trip_id: string
  airline: string | null
  airline_code: string
  flight_number: string | null
  departure_airport_code: string | null
  arrival_airport_code: string | null
  departure_at: string
}

interface StatusRow {
  transport_id: string
  gate: string | null
  prev_gate: string | null
}

function findFlight(
  transport: TransportRow,
  departures: IncheonFlightItem[],
  { allowAnyDay }: { allowAnyDay: boolean },
) {
  const matched = departures.filter((item) =>
    isSameFlight(item.flightId, {
      airlineCode: transport.airline_code,
      flightNumber: transport.flight_number ?? '',
    }),
  )

  if (matched.length === 0) return null

  // 같은 편명이 D+0~D+6 에 걸쳐 온다. 등록한 날짜의 편을 고른다. 없으면
  // 비워 둔다 -- 다른 날 편의 상태가 저장되면 안 된다.
  // 알림 테스트 모드만 아무거나 집는다.
  const sameDay = matched.find((item) => {
    const scheduledAt = toIsoFromApiDateTime(item.scheduleDateTime)
    if (scheduledAt == null) return false

    return getIsSameKstDate(transport.departure_at, scheduledAt)
  })

  if (sameDay != null) return sameDay

  return allowAnyDay ? matched[0] : null
}

async function observeFlights(
  serviceKey: string,
  transports: TransportRow[],
  notifyAlways: boolean,
  now: Date,
): Promise<Map<string, FlightObservation>> {
  const observations = new Map<string, FlightObservation>()

  const incheonTransports = transports.filter((t) => t.departure_airport_code === INCHEON)
  if (incheonTransports.length > 0) {
    const departures = await getIncheonDepartures(serviceKey)

    for (const transport of incheonTransports) {
      const flight = findFlight(transport, departures, { allowAnyDay: notifyAlways })
      if (flight != null) observations.set(transport.id, toIncheonObservation(flight))
    }
  }

  const koreaTransports = transports.filter(
    (t) => getIsKoreaAirport(t.departure_airport_code) && getIsObserveDue(t.departure_at, now),
  )
  if (koreaTransports.length > 0) {
    try {
      const koreaObservations = await observeKoreaAirportsFlights(serviceKey, koreaTransports, now)
      koreaObservations.forEach((observation, id) => observations.set(id, observation))
    } catch (error) {
      console.error('한국공항공사 운항 상태 조회 실패', error)
    }
  }

  return observations
}

async function notify(transport: TransportRow, status: WatchedStatus, isGateChanged: boolean) {
  const { data: members } = await supabase
    .from('trip_members')
    .select('user_id')
    .eq('trip_id', transport.trip_id)

  const recipientIds = (members ?? []).map((m: { user_id: string }) => m.user_id)
  if (recipientIds.length === 0) return 0

  const { data: subscriptions } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, subscription')
    .in('user_id', recipientIds)

  if (subscriptions == null || subscriptions.length === 0) return 0

  const arrivalCityName = (await getAirportCityName(supabase, transport.arrival_airport_code ?? '')) ?? '도착지'
  const { title, body } = toNotificationText(
    {
      airline: transport.airline ?? transport.airline_code,
      flightNumber: transport.flight_number ?? '',
      arrivalCityName,
    },
    status,
    isGateChanged,
  )

  // chat-web-push 는 제목을 여행 이름으로 덮고 발신자를 제외한다.
  // 운항 알림은 제목이 편명이고 제외할 발신자가 없어 계약이 맞지 않는다.
  // 경로 분기(웹 VAPID / 앱 Expo)만 같아서 헬퍼를 공유한다.
  type SubscriptionRow = { id: string; endpoint: string; subscription: unknown }
  const rows = subscriptions as SubscriptionRow[]
  const nativeRows = rows.filter((row) => isExpoPushToken(row.endpoint))
  const webRows = rows.filter((row) => !isExpoPushToken(row.endpoint))

  const payload = JSON.stringify({ title, body, tripId: transport.trip_id, transportId: transport.id })

  const webResults = await Promise.allSettled(
    webRows.map((row) =>
      webpush
        .sendNotification(row.subscription as webpush.PushSubscription, payload)
        .catch(async (err: { statusCode?: number }) => {
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
          { title, body, data: { tripId: transport.trip_id, transportId: transport.id } },
        )
      : { sent: 0, invalidTokens: [] as string[] }

  if (native.invalidTokens.length > 0) {
    await supabase.from('push_subscriptions').delete().in('endpoint', native.invalidTokens)
  }

  return webSent + native.sent
}

Deno.serve(async () => {
  const serviceKey = Deno.env.get('DATA_GO_SERVICE_KEY')
  if (serviceKey == null) {
    return Response.json({ error: 'DATA_GO_SERVICE_KEY 가 없습니다.' }, { status: 500 })
  }

  // 발송 경로를 실기기로 확인하는 동안만 켠다. 상태가 안 바뀌어도 매번
  // 보내고, 알림 창도 D+6 까지 넓혀 24시간 안에 뜨는 편이 없어도 걸린다.
  const notifyAlways = Deno.env.get('FLIGHT_STATUS_NOTIFY_ALWAYS') === 'true'

  const now = new Date()
  const notifyWindowHours = notifyAlways ? TEST_WINDOW_HOURS : NOTIFY_BEFORE_DEPARTURE_HOURS
  const { from, until } = getObserveRange(now)

  // 관측 범위: 출발 후 6시간 이내인 편부터 7일 뒤까지의 항공편.
  // 코드가 없는 행은 매칭할 수 없어 애초에 제외한다.
  const { data: transports, error } = await supabase
    .from('trip_transports')
    .select(
      'id, trip_id, airline, airline_code, flight_number, departure_airport_code, arrival_airport_code, departure_at',
    )
    .eq('type', 'flight')
    .in('departure_airport_code', [INCHEON, ...KOREA_AIRPORT_CODES])
    .not('airline_code', 'is', null)
    .not('flight_number', 'is', null)
    .gte('departure_at', from.toISOString())
    .lte('departure_at', until.toISOString())

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  const watched = (transports ?? []) as TransportRow[]

  if (watched.length === 0) {
    return Response.json({ watched: 0, notified: 0, matched: 0, notifyAlways })
  }

  const observations = await observeFlights(serviceKey, watched, notifyAlways, now)

  const watchedIds = watched.map((t) => t.id)
  const [
    { data: previousRows, error: previousError },
    { data: noticeRows, error: noticeError },
  ] = await Promise.all([
    supabase
      .from('trip_transport_flight_status')
      .select('transport_id, gate, prev_gate')
      .in('transport_id', watchedIds),
    supabase
      .from('trip_transport_flight_notices')
      .select('transport_id, last_notified_kind, last_notified_estimated_at, last_notified_gate')
      .in('transport_id', watchedIds),
  ])

  if (previousError != null || noticeError != null) {
    return Response.json({ error: (previousError ?? noticeError)?.message }, { status: 500 })
  }

  const previousById = new Map<string, StatusRow>(
    (previousRows ?? []).map((row: StatusRow): [string, StatusRow] => [row.transport_id, row]),
  )
  const noticeById = new Map<string, NoticeRow>(
    (noticeRows ?? []).map((row: NoticeRow): [string, NoticeRow] => [row.transport_id, row]),
  )

  let notified = 0
  let matched = 0

  for (const transport of watched) {
    const observation = observations.get(transport.id)
    if (observation == null) continue

    matched += 1

    const status: WatchedStatus = {
      kind: observation.kind,
      estimatedAt: observation.estimatedAt,
      gate: observation.gate,
    }

    const previous = previousById.get(transport.id)
    const notifiedStatus = toNotifiedStatus(noticeById.get(transport.id))
    const isWithinNotifyWindow = getIsWithinNotifyWindow(transport.departure_at, now, notifyWindowHours)
    const shouldNotify =
      isWithinNotifyWindow && getShouldNotify(status, notifiedStatus, { notifyAlways })
    const isGateChanged = getIsGateChanged(status, notifiedStatus)

    if (shouldNotify) {
      const sent = await notify(transport, status, isGateChanged)
      if (sent > 0) notified += 1
    }

    // 알림 발송 여부와 무관하게, 실제 gate 가 바뀐 순간의 직전 값을 그대로
    // 남긴다. 안 바뀌었으면 이미 저장된 이전 값을 지키고, 저장된 적이
    // 없으면(첫 조회) 비교 대상이 없어 비워둔다.
    const previousGate = previous?.gate || null
    const isRealGateChanged =
      previousGate != null && status.gate != null && previousGate !== status.gate
    const prevGate = isRealGateChanged ? previousGate : (previous?.prev_gate || null)

    if (shouldNotify) {
      const notice = nextNoticeState(status)

      const { error: noticeWriteError } = await supabase.from('trip_transport_flight_notices').upsert({
        transport_id: transport.id,
        last_notified_kind: notice.lastNotifiedKind,
        last_notified_estimated_at: notice.lastNotifiedEstimatedAt,
        last_notified_gate: notice.lastNotifiedGate,
        updated_at: new Date().toISOString(),
      })
      if (noticeWriteError != null) console.error('푸시 이력 저장 실패', transport.id, noticeWriteError)
    }

    await supabase.from('trip_transport_flight_status').upsert({
      transport_id: transport.id,
      kind: status.kind,
      scheduled_at: observation.scheduledAt,
      estimated_at: status.estimatedAt,
      gate: status.gate,
      terminal: observation.terminal,
      arrival_scheduled_at: observation.arrivalScheduledAt,
      arrival_estimated_at: observation.arrivalEstimatedAt,
      prev_gate: prevGate,
      checked_at: new Date().toISOString(),
    })
  }

  return Response.json({ watched: watched.length, matched, notified, notifyAlways })
})
