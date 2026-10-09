import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { createCongestionSnapshotLoader } from './congestion.ts'
import {
  getAirportArrivalGuidance,
  getLeastCongestedDepartureGate,
  type AirportArrivalGuidance,
  type AirportArrivalGuidancePolicy,
  type DepartureGateRecommendation,
} from './guidance.ts'
import { getGuidanceTerminal, toIncheonTerminalCode } from './incheonTerminal.ts'

interface TransportRow {
  id: string
  trip_id: string
  type: string
  departure_at: string
  departure_airport_code: string | null
}

interface FlightTransportRow extends TransportRow {
  departure_airport_code: string
}

interface FlightStatusRow {
  transport_id: string
  kind: string | null
  estimated_at: string | null
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

function isGuidableFlight(transport: TransportRow): transport is FlightTransportRow {
  return transport.type === 'flight' && transport.departure_airport_code != null
}

const MISSING_SERVICE_KEY_MESSAGE = 'DATA_GO_SERVICE_KEY 가 없습니다.'

type CongestionSnapshotLoader = ReturnType<typeof createCongestionSnapshotLoader>

async function getGuidanceForFlight(
  flight: FlightTransportRow,
  context: {
    flightStatus: FlightStatusRow | null
    isOverseas: boolean
    policy: AirportArrivalGuidancePolicy
    loadSnapshot: CongestionSnapshotLoader | null
    now: Date
  },
): Promise<AirportArrivalGuidance | null> {
  const { flightStatus, isOverseas } = context
  const isCancelled = flightStatus?.kind === 'cancelled'
  const appliedDepartureAt = flightStatus?.estimated_at ?? flight.departure_at

  const guidanceTerminal = getGuidanceTerminal({
    isOverseas,
    departureAirportCode: flight.departure_airport_code,
    flightStatusTerminal: flightStatus?.terminal ?? null,
  })

  if (guidanceTerminal == null || isCancelled) return null

  const forecastDate = isOverseas ? getForecastDateOffset(appliedDepartureAt, context.now) : undefined
  if (isOverseas && forecastDate == null) return null

  if (context.loadSnapshot == null) throw new Error(MISSING_SERVICE_KEY_MESSAGE)

  const snapshot = await context.loadSnapshot({
    sourceKind: isOverseas ? 'forecast' : 'domestic',
    airportCode: flight.departure_airport_code,
    terminal: guidanceTerminal.snapshotTerminal,
    forecastDate: forecastDate ?? undefined,
  })

  return getAirportArrivalGuidance({
    departureAt: flight.departure_at,
    estimatedDepartureAt: flightStatus?.estimated_at ?? undefined,
    isCancelled,
    isOverseas,
    departureTerminal: guidanceTerminal.responseTerminal,
    now: context.now.toISOString(),
    policy: context.policy,
    snapshot,
  })
}

export async function getGuidancesForTransports(
  supabase: SupabaseClient,
  input: {
    tripId: string
    transportIds: readonly string[]
    now: Date
  },
): Promise<{ transportId: string; guidance: AirportArrivalGuidance }[]> {
  if (input.transportIds.length === 0) return []

  const { data: transports } = await supabase
    .from('trip_transports')
    .select('id, trip_id, type, departure_at, departure_airport_code')
    .in('id', input.transportIds)
    .eq('trip_id', input.tripId)

  const transportRows: TransportRow[] = transports ?? []
  const flights = transportRows.filter(isGuidableFlight)
  if (flights.length === 0) return []

  const [{ data: flightStatuses }, { data: trip }, activePolicy] = await Promise.all([
    supabase
      .from('trip_transport_flight_status')
      .select('transport_id, kind, estimated_at, terminal')
      .in('transport_id', flights.map((flight) => flight.id)),
    supabase.from('trips').select('is_overseas').eq('id', input.tripId).maybeSingle(),
    getActivePolicy(supabase),
  ])

  const flightStatusRows: FlightStatusRow[] = flightStatuses ?? []
  const flightStatusByTransportId = new Map(flightStatusRows.map((status) => [status.transport_id, status]))
  const tripRow: TripRow | null = trip
  const isOverseas = tripRow?.is_overseas ?? false

  const serviceKey = Deno.env.get('DATA_GO_SERVICE_KEY')
  const loadSnapshot =
    serviceKey == null ? null : createCongestionSnapshotLoader(supabase, serviceKey, activePolicy.id)

  const guidances = await Promise.all(
    flights.map(async (flight) => ({
      transportId: flight.id,
      guidance: await getGuidanceForFlight(flight, {
        flightStatus: flightStatusByTransportId.get(flight.id) ?? null,
        isOverseas,
        policy: activePolicy.policy,
        loadSnapshot,
        now: input.now,
      }),
    })),
  )

  return guidances.flatMap(({ transportId, guidance }) => (guidance == null ? [] : [{ transportId, guidance }]))
}

export async function getGuidanceForTransport(
  supabase: SupabaseClient,
  input: {
    tripId: string
    transportId: string
    now: Date
  },
): Promise<AirportArrivalGuidance | null> {
  const [first] = await getGuidancesForTransports(supabase, {
    tripId: input.tripId,
    transportIds: [input.transportId],
    now: input.now,
  })

  return first?.guidance ?? null
}

const INCHEON_AIRPORT_CODE = 'ICN'

export async function getDepartureGateRecommendation(
  supabase: SupabaseClient,
  input: { terminal: string },
): Promise<DepartureGateRecommendation | null> {
  const terminalCode = toIncheonTerminalCode(input.terminal)
  if (terminalCode == null) return null

  const serviceKey = Deno.env.get('DATA_GO_SERVICE_KEY')
  if (serviceKey == null) throw new Error(MISSING_SERVICE_KEY_MESSAGE)

  const activePolicy = await getActivePolicy(supabase)
  const loadSnapshot = createCongestionSnapshotLoader(supabase, serviceKey, activePolicy.id)
  const realtimeSnapshot = await loadSnapshot({
    sourceKind: 'realtime',
    airportCode: INCHEON_AIRPORT_CODE,
    terminal: terminalCode,
  })

  return getLeastCongestedDepartureGate(realtimeSnapshot)
}

interface PolicyRow {
  id: string
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

async function getActivePolicy(
  supabase: SupabaseClient,
): Promise<{ id: string; policy: AirportArrivalGuidancePolicy }> {
  const { data, error } = await supabase
    .from('airport_arrival_guidance_policies')
    .select(
      'id, domestic_base_buffer_minutes, international_base_buffer_minutes, calm_max_ratio, normal_max_ratio, crowded_max_ratio, calm_extra_minutes, normal_extra_minutes, crowded_extra_minutes, very_crowded_extra_minutes',
    )
    .eq('is_active', true)
    .single()

  if (error != null || data == null) {
    throw new Error('활성 공항 도착 안내 정책이 없습니다.')
  }

  const policy = data as PolicyRow
  return {
    id: policy.id,
    policy: {
      domesticBaseBufferMinutes: policy.domestic_base_buffer_minutes,
      internationalBaseBufferMinutes: policy.international_base_buffer_minutes,
      calmMaxRatio: policy.calm_max_ratio,
      normalMaxRatio: policy.normal_max_ratio,
      crowdedMaxRatio: policy.crowded_max_ratio,
      calmExtraMinutes: policy.calm_extra_minutes,
      normalExtraMinutes: policy.normal_extra_minutes,
      crowdedExtraMinutes: policy.crowded_extra_minutes,
      veryCrowdedExtraMinutes: policy.very_crowded_extra_minutes,
    },
  }
}
