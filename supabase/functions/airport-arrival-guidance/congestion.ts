import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'
import type { AirportCongestionSourceKind } from './types.ts'

// 티켓의 터미널은 사용자 자유 입력이라 "2", "T2", "제2터미널"처럼 표기가
// 갈린다. 인천공항은 여객터미널이 1·2 뿐이므로 "2"가 있으면 T2, 그 외
// (미기재 포함)는 T1로 본다.
function toIncheonTerminalCode(terminal: string): 'T1' | 'T2' {
  return terminal.includes('2') ? 'T2' : 'T1'
}

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
    // 출국장 혼잡도 API 는 items 가 배열 자체다. 다른 공공데이터 API 는
    // items.item 래퍼를 쓰므로 둘 다 받는다.
    body?: { items?: TItem[] | { item?: TItem | TItem[] } }
  }
}

function toItemArray<TItem>(body: Envelope<TItem>['response']['body']): TItem[] {
  const items = body?.items
  if (items == null) return []
  if (Array.isArray(items)) return items

  const item = items.item
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
  const gateKeys = toIncheonTerminalCode(terminal) === 'T2' ? T2_FORECAST_GATES : T1_FORECAST_GATES

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
  const isT2 = toIncheonTerminalCode(terminal) === 'T2'
  const url = isT2
    ? new URL('https://apis.data.go.kr/B551177/statusOfDepartureCongestionT2/getDepartureCongestionT2')
    : new URL('https://apis.data.go.kr/B551177/statusOfDepartureCongestion/getDepartureCongestion')

  url.searchParams.set('serviceKey', serviceKey)
  url.searchParams.set('type', 'json')
  url.searchParams.set('numOfRows', '20')
  url.searchParams.set('pageNo', '1')
  if (!isT2) url.searchParams.set('terminalId', 'P01')

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

const REALTIME_TTL_MS = 2 * 60 * 1000
const FORECAST_TTL_MS = 24 * 60 * 60 * 1000

interface ReferenceCountRow {
  departure_gate: string
  reference_passenger_count: number
}

interface CongestionSnapshotRow {
  source_kind: AirportCongestionSourceKind
  airport_code: string
  terminal: string
  observed_at: string
  departure_gates: CongestionDepartureGate[]
}

export interface CongestionSnapshotRequest {
  sourceKind: AirportCongestionSourceKind
  airportCode: string
  terminal: string
  forecastDate?: string
}

export function toCongestionSnapshotKey(request: CongestionSnapshotRequest): string {
  const forecastDate = request.sourceKind === 'forecast' ? (request.forecastDate ?? '') : ''
  return [request.sourceKind, request.airportCode, request.terminal, forecastDate].join('|')
}

const SNAPSHOT_COLUMNS = 'source_kind, airport_code, terminal, observed_at, departure_gates'

async function applyReferenceCounts(
  supabase: SupabaseClient,
  policyId: string,
  request: CongestionSnapshotRequest,
  gates: CongestionDepartureGate[],
): Promise<CongestionDepartureGateWithReference[]> {
  const { data: references, error } = await supabase
    .from('airport_congestion_reference_counts')
    .select('departure_gate, reference_passenger_count')
    .eq('policy_id', policyId)
    .eq('source_kind', request.sourceKind)
    .eq('airport_code', request.airportCode)
    .eq('terminal', request.terminal)

  if (error != null) throw new Error(error.message)

  const referenceByGate = new Map(
    ((references ?? []) as ReferenceCountRow[]).map((row) => [row.departure_gate, row.reference_passenger_count]),
  )

  return gates.map((gate) => ({
    ...gate,
    referencePassengerCount: referenceByGate.get(gate.gate) ?? (gate.passengerCount || 1),
  }))
}

async function loadRawCongestionSnapshot(
  supabase: SupabaseClient,
  serviceKey: string,
  request: CongestionSnapshotRequest,
): Promise<CongestionSnapshotRow> {
  const now = new Date()
  const isForecast = request.sourceKind === 'forecast'

  let query = supabase
    .from('airport_congestion_snapshots')
    .select(SNAPSHOT_COLUMNS)
    .eq('source_kind', request.sourceKind)
    .eq('airport_code', request.airportCode)
    .eq('terminal', request.terminal)
    .gt('expires_at', now.toISOString())
    .order('observed_at', { ascending: false })
    .limit(1)

  query = isForecast
    ? query.eq('snapshot_date', request.forecastDate ?? null)
    : query.is('snapshot_date', null)

  const { data: cached } = await query.maybeSingle()
  if (cached != null) return cached

  const normalized =
    request.sourceKind === 'forecast'
      ? await fetchForecastCongestion(serviceKey, request.terminal, request.forecastDate ?? '0')
      : request.sourceKind === 'realtime'
        ? await fetchRealtimeCongestion(serviceKey, request.terminal)
        : await fetchDomesticCongestion(serviceKey, request.airportCode)

  const ttlMs = isForecast ? FORECAST_TTL_MS : REALTIME_TTL_MS

  const { data: inserted, error } = await supabase
    .from('airport_congestion_snapshots')
    .insert({
      source_kind: request.sourceKind,
      airport_code: request.airportCode,
      terminal: request.terminal,
      snapshot_date: isForecast ? (request.forecastDate ?? null) : null,
      observed_at: normalized.observedAt,
      expires_at: new Date(now.getTime() + ttlMs).toISOString(),
      raw_response: normalized.rawResponse,
      departure_gates: normalized.departureGates,
    })
    .select(SNAPSHOT_COLUMNS)
    .single()

  if (error != null || inserted == null) {
    throw new Error(error?.message ?? '공항 혼잡 스냅샷 저장에 실패했습니다.')
  }

  return inserted
}

async function loadCongestionSnapshot(
  supabase: SupabaseClient,
  serviceKey: string,
  policyId: string,
  request: CongestionSnapshotRequest,
): Promise<CongestionSnapshotData> {
  const row = await loadRawCongestionSnapshot(supabase, serviceKey, request)
  const departureGates = await applyReferenceCounts(supabase, policyId, request, row.departure_gates)

  return {
    sourceKind: row.source_kind,
    airportCode: row.airport_code,
    terminal: row.terminal,
    observedAt: row.observed_at,
    departureGates,
  }
}

export function createCongestionSnapshotLoader(
  supabase: SupabaseClient,
  serviceKey: string,
  policyId: string,
): (request: CongestionSnapshotRequest) => Promise<CongestionSnapshotData> {
  const snapshotByKey = new Map<string, Promise<CongestionSnapshotData>>()

  return (request) => {
    const key = toCongestionSnapshotKey(request)
    const pending = snapshotByKey.get(key)
    if (pending != null) return pending

    const snapshot = loadCongestionSnapshot(supabase, serviceKey, policyId, request)
    snapshotByKey.set(key, snapshot)
    return snapshot
  }
}
