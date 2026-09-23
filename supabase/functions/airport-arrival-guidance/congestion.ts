import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'
import type { AirportCongestionSourceKind } from './types.ts'

export interface CongestionDepartureGate {
  gate: string
  passengerCount: number
}

export interface NormalizedCongestion {
  observedAt: string
  departureGates: CongestionDepartureGate[]
  rawResponse: unknown
}

export interface CongestionDepartureGateWithReference extends CongestionDepartureGate {
  referencePassengerCount: number
}

export interface CongestionSnapshotData {
  sourceKind: AirportCongestionSourceKind
  airportCode: string
  terminal: string
  observedAt: string
  departureGates: CongestionDepartureGateWithReference[]
}

interface Envelope<TItem> {
  response: {
    header: { resultCode: string; resultMsg: string }
    body?: { items?: { item?: TItem | TItem[] } }
  }
}

function toItemArray<TItem>(body: Envelope<TItem>['response']['body']): TItem[] {
  const item = body?.items?.item
  if (item == null) return []
  return Array.isArray(item) ? item : [item]
}

async function fetchDataGoKr<TItem>(url: URL): Promise<TItem[]> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`공항 API HTTP ${response.status}`)
  }

  const envelope = (await response.json()) as Envelope<TItem>
  if (envelope.response.header.resultCode !== '00') {
    throw new Error(envelope.response.header.resultMsg)
  }

  return toItemArray(envelope.response.body)
}

// 원문: adate(YYYYMMDD), atime(HH_HH, 1시간 간격). 자정 관측 시각으로만 쓴다 --
// 시간대별 값을 그대로 두면 가장 혼잡한 시간대 선택은 도메인 계산이 맡는다.
interface PassgrAnncmtItem {
  adate: string
  atime: string
  t1dg1: string
  t1dg2: string
  t1dg3: string
  t1dg4: string
  t1dg5: string
  t1dg6: string
  t2dg1: string
  t2dg2: string
}

const T1_FORECAST_GATES: (keyof PassgrAnncmtItem)[] = ['t1dg1', 't1dg2', 't1dg3', 't1dg4', 't1dg5', 't1dg6']
const T2_FORECAST_GATES: (keyof PassgrAnncmtItem)[] = ['t2dg1', 't2dg2']

async function fetchForecastCongestion(
  serviceKey: string,
  terminal: string,
  forecastDate: string,
): Promise<NormalizedCongestion> {
  const url = new URL('https://apis.data.go.kr/B551177/passgrAnncmt/getPassgrAnncmt')
  url.searchParams.set('serviceKey', serviceKey)
  url.searchParams.set('type', 'json')
  url.searchParams.set('numOfRows', '48')
  url.searchParams.set('pageNo', '1')
  url.searchParams.set('selectdate', forecastDate)

  const items = await fetchDataGoKr<PassgrAnncmtItem>(url)
  const gateKeys = terminal === 'T2' ? T2_FORECAST_GATES : T1_FORECAST_GATES

  // 예고 데이터는 시간대별로 여러 행이 온다. 출국장별 가장 혼잡한(최댓값)
  // 시간대를 그 출국장의 대표값으로 쓴다.
  const passengerCountByGate = new Map<string, number>()
  for (const item of items) {
    for (const key of gateKeys) {
      const count = Number(item[key])
      if (!Number.isFinite(count)) continue

      const current = passengerCountByGate.get(key) ?? 0
      if (count > current) passengerCountByGate.set(key, count)
    }
  }

  return {
    observedAt: new Date().toISOString(),
    departureGates: gateKeys.map((key) => ({
      gate: key,
      passengerCount: passengerCountByGate.get(key) ?? 0,
    })),
    rawResponse: items,
  }
}

interface DepartureCongestionItem {
  terminalId: string
  gateId: string
  waitLength: string
  occurtime: string
}

async function fetchRealtimeCongestion(
  serviceKey: string,
  terminal: string,
): Promise<NormalizedCongestion> {
  const url =
    terminal === 'T2'
      ? new URL('https://apis.data.go.kr/B551177/statusOfDepartureCongestionT2/getDepartureCongestionT2')
      : new URL('https://apis.data.go.kr/B551177/statusOfDepartureCongestion/getDepartureCongestion')

  url.searchParams.set('serviceKey', serviceKey)
  url.searchParams.set('type', 'json')
  url.searchParams.set('numOfRows', '20')
  url.searchParams.set('pageNo', '1')
  if (terminal !== 'T2') url.searchParams.set('terminalId', 'P01')

  const items = await fetchDataGoKr<DepartureCongestionItem>(url)

  return {
    observedAt: new Date().toISOString(),
    departureGates: items.map((item) => ({
      gate: item.gateId,
      passengerCount: Number(item.waitLength) || 0,
    })),
    rawResponse: items,
  }
}

// 한국공항공사 API 는 출국장별 인원수가 아니라 구간별 혼잡도 레벨(1~4)만
// 준다. 레벨을 그대로 passengerCount 자리에 담아 저장하고, 그 값을 인원
// 비율이 아니라 등급 자체로 다루는 변환은 도메인(getCongestionTier) 쪽
// 정책과 함께 맞춰야 한다.
// TODO(공항안내 정책): domestic 출처는 passengerCount/referencePassengerCount
// 비율 공식이 아니라 레벨 값을 직접 등급에 매핑해야 한다. 문서:
// docs/superpowers/specs/2026-09-21-airport-arrival-guidance-design.md
interface DomesticCongestionItem {
  IATA_APCD: string
  CGDR_ALL_LVL: string
}

async function fetchDomesticCongestion(
  serviceKey: string,
  airportCode: string,
): Promise<NormalizedCongestion> {
  const isV2Airport = ['PUS', 'TAE', 'CJJ'].includes(airportCode)
  const url = new URL(
    `https://apis.data.go.kr/B551178/airport-congestion/${isV2Airport ? 'v2' : 'v1'}`,
  )
  url.searchParams.set('serviceKey', serviceKey)
  url.searchParams.set('type', 'json')
  url.searchParams.set('numOfRows', '20')
  url.searchParams.set('pageNo', '1')

  const items = await fetchDataGoKr<DomesticCongestionItem>(url)
  const matched = items.filter((item) => item.IATA_APCD === airportCode)

  return {
    observedAt: new Date().toISOString(),
    departureGates: matched.map((item) => ({
      gate: item.IATA_APCD,
      passengerCount: Number(item.CGDR_ALL_LVL) || 0,
    })),
    rawResponse: items,
  }
}

export interface FreshCongestionSnapshotInput {
  sourceKind: AirportCongestionSourceKind
  airportCode: string
  terminal: string
  forecastDate?: string
}

export interface FreshCongestionSnapshotResult {
  snapshotId: string
  isCacheHit: boolean
}

const REALTIME_TTL_MS = 2 * 60 * 1000
const FORECAST_TTL_MS = 24 * 60 * 60 * 1000

interface ReferenceCountRow {
  departure_gate: string
  reference_passenger_count: number
}

async function withReferenceCounts(
  supabase: SupabaseClient,
  input: FreshCongestionSnapshotInput,
  gates: CongestionDepartureGate[],
): Promise<CongestionDepartureGateWithReference[]> {
  const { data: policy } = await supabase
    .from('airport_arrival_guidance_policies')
    .select('id')
    .eq('is_active', true)
    .single()

  const { data: references } = policy
    ? await supabase
        .from('airport_congestion_reference_counts')
        .select('departure_gate, reference_passenger_count')
        .eq('policy_id', policy.id)
        .eq('source_kind', input.sourceKind)
        .eq('airport_code', input.airportCode)
        .eq('terminal', input.terminal)
    : { data: null }

  const referenceByGate = new Map(
    ((references ?? []) as ReferenceCountRow[]).map((row) => [row.departure_gate, row.reference_passenger_count]),
  )

  return gates.map((gate) => ({
    ...gate,
    // 기준값이 없는 출국장은 실측값을 그대로 기준으로 삼아 비율 1을 만든다 --
    // 관리자가 기준값을 아직 등록하지 않았다고 해서 안내를 막지 않는다.
    referencePassengerCount: referenceByGate.get(gate.gate) ?? (gate.passengerCount || 1),
  }))
}

/**
 * 유효한 스냅샷이 있으면 재사용하고, 없거나 만료됐으면 API 를 호출해
 * 정규화한 결과를 저장한다.
 */
export async function getFreshCongestionSnapshot(
  supabase: SupabaseClient,
  serviceKey: string,
  input: FreshCongestionSnapshotInput,
): Promise<FreshCongestionSnapshotResult> {
  const now = new Date()

  let query = supabase
    .from('airport_congestion_snapshots')
    .select('id')
    .eq('source_kind', input.sourceKind)
    .eq('airport_code', input.airportCode)
    .eq('terminal', input.terminal)
    .gt('expires_at', now.toISOString())
    .order('observed_at', { ascending: false })
    .limit(1)

  query =
    input.sourceKind === 'forecast'
      ? query.eq('snapshot_date', input.forecastDate ?? null)
      : query.is('snapshot_date', null)

  const { data: cached } = await query.maybeSingle()
  if (cached != null) {
    return { snapshotId: cached.id, isCacheHit: true }
  }

  const normalized =
    input.sourceKind === 'forecast'
      ? await fetchForecastCongestion(serviceKey, input.terminal, input.forecastDate ?? '0')
      : input.sourceKind === 'realtime'
        ? await fetchRealtimeCongestion(serviceKey, input.terminal)
        : await fetchDomesticCongestion(serviceKey, input.airportCode)

  const departureGates = await withReferenceCounts(supabase, input, normalized.departureGates)
  const ttlMs = input.sourceKind === 'forecast' ? FORECAST_TTL_MS : REALTIME_TTL_MS

  const { data: inserted, error } = await supabase
    .from('airport_congestion_snapshots')
    .insert({
      source_kind: input.sourceKind,
      airport_code: input.airportCode,
      terminal: input.terminal,
      snapshot_date: input.sourceKind === 'forecast' ? (input.forecastDate ?? null) : null,
      observed_at: normalized.observedAt,
      expires_at: new Date(now.getTime() + ttlMs).toISOString(),
      raw_response: normalized.rawResponse,
      departure_gates: departureGates,
    })
    .select('id')
    .single()

  if (error != null || inserted == null) {
    throw new Error(error?.message ?? '공항 혼잡 스냅샷 저장에 실패했습니다.')
  }

  return { snapshotId: inserted.id, isCacheHit: false }
}

interface CongestionSnapshotRow {
  source_kind: AirportCongestionSourceKind
  airport_code: string
  terminal: string
  observed_at: string
  departure_gates: CongestionDepartureGateWithReference[]
}

/** 저장된 스냅샷을 도메인 계산에 바로 넣을 수 있는 형태로 읽어온다. */
export async function getCongestionSnapshotData(
  supabase: SupabaseClient,
  snapshotId: string,
): Promise<CongestionSnapshotData | null> {
  const { data } = await supabase
    .from('airport_congestion_snapshots')
    .select('source_kind, airport_code, terminal, observed_at, departure_gates')
    .eq('id', snapshotId)
    .maybeSingle()

  if (data == null) return null

  const row = data as CongestionSnapshotRow
  const departureGates = await withReferenceCounts(supabase, {
    sourceKind: row.source_kind,
    airportCode: row.airport_code,
    terminal: row.terminal,
  }, row.departure_gates)

  return {
    sourceKind: row.source_kind,
    airportCode: row.airport_code,
    terminal: row.terminal,
    observedAt: row.observed_at,
    departureGates,
  }
}
