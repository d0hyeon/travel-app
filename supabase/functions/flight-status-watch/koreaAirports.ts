import type { FlightObservation } from './flightObservation.ts'
import { isSameFlight, toIsoFromApiDateTime } from './incheonFlights.ts'

const BASE_URL = 'https://apis.data.go.kr/B551178/flight-status'
const PAGE_SIZE = 100
const MAX_PAGES = 10
const KST_OFFSET_MS = 9 * 60 * 60 * 1000
const HOUR_MS = 60 * 60 * 1000
const DEPART_MARGIN_HOURS = 2
const ARRIVAL_SPAN_HOURS = 5

// 원본: packages/domains/src/modules/flight-status/koreaAirportsFlightStatus.provider.ts
export const KOREA_AIRPORT_CODES: readonly string[] = [
  'CJU',
  'GMP',
  'PUS',
  'CJJ',
  'TAE',
  'KWJ',
  'USN',
  'HIN',
  'RSU',
  'KPO',
  'KUV',
  'YNY',
  'WJU',
]

export function getIsKoreaAirport(code: string | null) {
  return code != null && KOREA_AIRPORT_CODES.includes(code)
}

export interface KoreaAirportFlightItem {
  flightid: string
  masterflightid: string | null
  scheduledatetime: string
  estimateddatetime: string | null
  rmkKor: string | null
}

export interface KoreaAirportInfoItem {
  airFln: string
  std: string
  gate: string | null
}

const CANCELLED_REMARKS = ['결항', '사전결항']

export function toKoreaAirportsKind(
  remark: string | null,
  scheduledAt: string | null,
  estimatedAt: string | null,
): string {
  if (remark == null) return 'scheduled'
  if (CANCELLED_REMARKS.includes(remark)) return 'cancelled'
  if (remark === '회항') return 'diverted'
  if (remark === '출발') return 'departed'
  if (remark === '지연') return getIsLater(estimatedAt, scheduledAt) ? 'delayed' : 'scheduled'

  return 'scheduled'
}

function getIsLater(left: string | null, right: string | null) {
  if (left == null || right == null) return false

  return new Date(left).getTime() > new Date(right).getTime()
}

export function getMatchKey(item: { flightid: string; masterflightid: string | null }) {
  return item.masterflightid?.trim() || item.flightid
}

function toHourTime(hour: number, minute: '00' | '59') {
  return `${String(hour).padStart(2, '0')}${minute}`
}

export function getKoreaAirportsWindow(departureAt: string) {
  const kst = new Date(new Date(departureAt).getTime() + KST_OFFSET_MS)
  const searchday = kst.toISOString().slice(0, 10).replaceAll('-', '')
  const hour = kst.getUTCHours()

  return {
    searchday,
    departFrom: toHourTime(Math.max(0, hour - DEPART_MARGIN_HOURS), '00'),
    departTo: toHourTime(Math.min(23, hour + DEPART_MARGIN_HOURS), '59'),
    arrivalFrom: toHourTime(hour, '00'),
    arrivalTo: toHourTime(Math.min(23, hour + ARRIVAL_SPAN_HOURS), '59'),
  }
}

export function findGate(infos: KoreaAirportInfoItem[], departure: KoreaAirportFlightItem) {
  const scheduledTime = departure.scheduledatetime.slice(8, 12)
  const info = infos.find((item) => item.airFln === departure.flightid && item.std === scheduledTime)

  return info?.gate?.trim() || null
}

export function toObservation(
  departure: KoreaAirportFlightItem,
  arrivals: KoreaAirportFlightItem[],
  gate: string | null,
): FlightObservation {
  const scheduledAt = toIsoFromApiDateTime(departure.scheduledatetime)
  const estimatedAt = toIsoFromApiDateTime(departure.estimateddatetime)
  const arrival = arrivals.find((item) => getMatchKey(item) === getMatchKey(departure))

  const departureKind = toKoreaAirportsKind(departure.rmkKor, scheduledAt, estimatedAt)
  const hasArrived = departureKind === 'departed' && arrival?.rmkKor === '도착'

  return {
    kind: hasArrived ? 'arrived' : departureKind,
    scheduledAt,
    estimatedAt,
    gate,
    terminal: null,
    arrivalScheduledAt: toIsoFromApiDateTime(arrival?.scheduledatetime ?? null),
    arrivalEstimatedAt: toIsoFromApiDateTime(arrival?.estimateddatetime ?? null),
  }
}

type Operation = 'depart' | 'arrival' | 'info'

interface ListQuery {
  operation: Operation
  params: Record<string, string>
}

interface ListEnvelope<TItem> {
  response?: {
    header: { resultCode: string; resultMsg: string }
    body?: { totalCount: number; items?: { item?: TItem | TItem[] } | '' }
  }
}

async function fetchPage<TItem>(serviceKey: string, query: ListQuery, pageNo: number) {
  const url = new URL(`${BASE_URL}/${query.operation}`)
  url.searchParams.set('serviceKey', serviceKey)
  url.searchParams.set('type', 'json')
  url.searchParams.set('pageNo', String(pageNo))
  url.searchParams.set('numOfRows', String(PAGE_SIZE))
  Object.entries(query.params).forEach(([name, value]) => url.searchParams.set(name, value))

  const response = await fetch(url)
  if (!response.ok) throw new Error(`한국공항공사 API HTTP ${response.status}`)

  const { response: body } = (await response.json()) as ListEnvelope<TItem>
  if (body == null) throw new Error('한국공항공사 API 응답 형식 오류')
  if (body.header.resultCode !== '00') throw new Error(body.header.resultMsg)

  const rawItems = body.body?.items
  const items = toArray(rawItems === '' ? undefined : rawItems?.item)

  return { items, totalCount: body.body?.totalCount ?? 0 }
}

function toArray<TItem>(value: TItem | TItem[] | null | undefined): TItem[] {
  if (value == null) return []

  return Array.isArray(value) ? value : [value]
}

async function fetchList<TItem>(serviceKey: string, query: ListQuery): Promise<TItem[]> {
  const collected: TItem[] = []

  for (let pageNo = 1; pageNo <= MAX_PAGES; pageNo += 1) {
    const { items, totalCount } = await fetchPage<TItem>(serviceKey, query, pageNo)
    collected.push(...items)
    if (items.length === 0 || collected.length >= totalCount) break
  }

  return collected
}

export interface ObservedTransport {
  id: string
  airline_code: string
  flight_number: string | null
  departure_airport_code: string | null
  arrival_airport_code: string | null
  departure_at: string
}

export async function observeKoreaAirportsFlights(
  serviceKey: string,
  transports: ObservedTransport[],
  now: Date,
): Promise<Map<string, FlightObservation>> {
  const lists = new Map<string, Promise<unknown[]>>()
  const getList = <TItem>(query: ListQuery) => {
    const key = `${query.operation}|${JSON.stringify(query.params)}`
    const cached = lists.get(key)
    if (cached != null) return cached as Promise<TItem[]>

    const request = fetchList<TItem>(serviceKey, query)
    lists.set(key, request)
    return request
  }

  const today = getKoreaDay(now)
  const observations = new Map<string, FlightObservation>()

  for (const transport of transports) {
    if (transport.departure_airport_code == null) continue

    try {
      const observation = await observeTransport(getList, transport, transport.departure_airport_code, today)
      if (observation != null) observations.set(transport.id, observation)
    } catch (error) {
      console.error('한국공항공사 운항 상태 조회 실패', transport.id, error)
    }
  }

  return observations
}

function getKoreaDay(date: Date) {
  return new Date(date.getTime() + KST_OFFSET_MS).toISOString().slice(0, 10).replaceAll('-', '')
}

async function observeTransport(
  getList: <TItem>(query: ListQuery) => Promise<TItem[]>,
  transport: ObservedTransport,
  departureAirportCode: string,
  today: string,
): Promise<FlightObservation | null> {
  const window = getKoreaAirportsWindow(transport.departure_at)
  const departures = await getList<KoreaAirportFlightItem>({
    operation: 'depart',
    params: {
      airport_code: departureAirportCode,
      searchday: window.searchday,
      from_time: window.departFrom,
      to_time: window.departTo,
    },
  })

  const departure = departures.find((item) =>
    isSameFlight(item.flightid, {
      airlineCode: transport.airline_code,
      flightNumber: transport.flight_number ?? '',
    }),
  )
  if (departure == null) return null

  const arrivalAirportCode = transport.arrival_airport_code
  const arrivals =
    arrivalAirportCode != null && getIsKoreaAirport(arrivalAirportCode)
      ? await getList<KoreaAirportFlightItem>({
          operation: 'arrival',
          params: {
            airport_code: arrivalAirportCode,
            searchday: window.searchday,
            from_time: window.arrivalFrom,
            to_time: window.arrivalTo,
          },
        })
      : []

  const infos =
    window.searchday === today
      ? await getList<KoreaAirportInfoItem>({
          operation: 'info',
          params: { schAirCode: departureAirportCode, schIOType: 'O' },
        })
      : []

  return toObservation(departure, arrivals, findGate(infos, departure))
}
