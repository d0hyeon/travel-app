import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { getCongestionSnapshotData, getFreshCongestionSnapshot } from './congestion.ts'
import {
  getAirportArrivalGuidance,
  getRecommendedDepartureGate,
  type AirportArrivalGuidance,
} from './guidance.ts'
import { getGuidanceTerminal } from './incheonTerminal.ts'

interface TransportRow {
  id: string
  trip_id: string
  type: string
  departure_at: string
  departure_airport_code: string | null
  arrival_airport_code: string | null
}

interface FlightStatusRow {
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

export async function getGuidanceForTransport(
  supabase: SupabaseClient,
  input: {
    tripId: string
    transportId: string
    now: Date
  },
): Promise<AirportArrivalGuidance | null> {
  const { data: transport } = await supabase
    .from('trip_transports')
    .select('id, trip_id, type, departure_at, departure_airport_code')
    .eq('id', input.transportId)
    .eq('trip_id', input.tripId)
    .maybeSingle()

  if (transport == null) return null
  const typedTransport = transport as TransportRow
  if (typedTransport.type !== 'flight' || typedTransport.departure_airport_code == null) return null

  const [{ data: flightStatus }, { data: trip }, policy] = await Promise.all([
    supabase
      .from('trip_transport_flight_status')
      .select('kind, estimated_at, terminal')
      .eq('transport_id', typedTransport.id)
      .maybeSingle(),
    supabase.from('trips').select('is_overseas').eq('id', input.tripId).maybeSingle(),
    getActivePolicy(supabase),
  ])

  const typedFlightStatus = flightStatus as FlightStatusRow | null
  const typedTrip = trip as TripRow | null
  const isOverseas = typedTrip?.is_overseas ?? false
  const isCancelled = typedFlightStatus?.kind === 'cancelled'
  const appliedDepartureAt = typedFlightStatus?.estimated_at ?? typedTransport.departure_at

  const guidanceTerminal = getGuidanceTerminal({
    isOverseas,
    departureAirportCode: typedTransport.departure_airport_code,
    flightStatusTerminal: typedFlightStatus?.terminal ?? null,
  })

  if (guidanceTerminal == null || isCancelled) return null

  const forecastDate = isOverseas ? getForecastDateOffset(appliedDepartureAt, input.now) : undefined
  if (isOverseas && forecastDate == null) return null

  const serviceKey = Deno.env.get('DATA_GO_SERVICE_KEY')
  if (serviceKey == null) throw new Error('DATA_GO_SERVICE_KEY 가 없습니다.')

  const { snapshotId } = await getFreshCongestionSnapshot(supabase, serviceKey, {
    sourceKind: isOverseas ? 'forecast' : 'domestic',
    airportCode: typedTransport.departure_airport_code,
    terminal: guidanceTerminal.snapshotTerminal,
    forecastDate: forecastDate ?? undefined,
  })
  const snapshot = await getCongestionSnapshotData(supabase, snapshotId)

  const guidance = getAirportArrivalGuidance({
    departureAt: typedTransport.departure_at,
    estimatedDepartureAt: typedFlightStatus?.estimated_at ?? undefined,
    isCancelled,
    isOverseas,
    departureTerminal: guidanceTerminal.responseTerminal,
    now: input.now.toISOString(),
    policy,
    snapshot,
  })
  if (guidance == null || !isOverseas) return guidance

  const { snapshotId: realtimeSnapshotId } = await getFreshCongestionSnapshot(supabase, serviceKey, {
    sourceKind: 'realtime',
    airportCode: typedTransport.departure_airport_code,
    terminal: guidanceTerminal.snapshotTerminal,
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

async function getActivePolicy(supabase: SupabaseClient) {
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
