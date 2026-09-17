import { governmentApi, type GovernmentApiResponse } from '../../gateways/client'
import type { AirportCode } from '../airport'
import {
  FlightStatusKind,
  type FlightStatus,
  type FlightStatusProvider,
  type GetFlightStatusParams,
} from './flightStatus.types'
import {
  isSameFlight,
  toFlightStatusKind,
  toIsoFromApiDateTime,
} from './incheonFlightStatus.utils'

const INCHEON_AIRPORT_CODE = 'ICN'
const AVAILABLE_DAYS = 7
const PAGE_SIZE = 9999

const endpoint = {
  departure:
    '/B551177/StatusOfPassengerFlightsDSOdp/getPassengerDeparturesDSOdp',
  arrival: '/B551177/StatusOfPassengerFlightsDSOdp/getPassengerArrivalsDSOdp',
} as const

interface IncheonFlightItem {
  airline: string
  flightId: string
  scheduleDateTime: string
  estimatedDateTime: string | null
  airport: string
  airportCode: string
  gatenumber: string | null
  terminalid: string | null
  remark: string | null
  codeshare: string
  masterflightid: string
}

type IncheonFlightEnvelope = GovernmentApiResponse<{
  totalCount: number
  items: IncheonFlightItem[]
}>

async function getFlights(direction: keyof typeof endpoint) {
  const { response } = await governmentApi.get<IncheonFlightEnvelope>(endpoint[direction], {
    params: { type: 'json', numOfRows: PAGE_SIZE, pageNo: 1 },
  })

  if (response.header.resultCode !== '00') {
    throw new Error(response.header.resultMsg)
  }

  return response.body.items ?? []
}

function toFlightStatus(item: IncheonFlightItem): FlightStatus {
  const scheduledAt = toIsoFromApiDateTime(item.scheduleDateTime)
  const estimatedAt = toIsoFromApiDateTime(item.estimatedDateTime ?? undefined)

  return {
    kind: toFlightStatusKind(item.remark ?? undefined),
    label: item.remark ?? undefined,
    scheduledAt: scheduledAt ?? item.scheduleDateTime,
    estimatedAt: estimatedAt === scheduledAt ? undefined : estimatedAt,
    gate: item.gatenumber ?? undefined,
    terminal: item.terminalid ?? undefined,
  }
}

// 인천은 D+0~D+6 만 준다. 그 밖이면 호출해도 빈손이라 묻지 않는다.
function getIsAvailability(departureAt: string) {
  const departure = new Date(departureAt)
  if (Number.isNaN(departure.getTime())) return false

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const limit = new Date(today)
  limit.setDate(limit.getDate() + AVAILABLE_DAYS)

  return departure >= today && departure < limit
}

// 편명 하나가 코드셰어로 여러 행에 걸친다(Slave 가 전체의 절반이다).
// 어느 행이든 운항 정보는 같으므로 먼저 맞는 것을 쓴다.
export async function getIncheonFlightStatus({
  airlineCode,
  flightNumber,
  departureAirportCode,
  departureAt,
}: GetFlightStatusParams): Promise<FlightStatus | null> {
  if (airlineCode === '' || flightNumber === '') return null

  const direction = departureAirportCode === INCHEON_AIRPORT_CODE ? 'departure' : 'arrival'
  const items = await getFlights(direction)

  const departureDate = toIsoFromApiDateTime(
    departureAt.replace(/\D/g, '').slice(0, 12),
  )
  const scheduledDay = (departureDate ?? departureAt).slice(0, 10)

  const matched = items.filter((item) => isSameFlight(item.flightId, { airlineCode, flightNumber }))
  if (matched.length === 0) return null

  // 같은 편명이 여러 날에 걸쳐 온다. 등록한 날짜의 편을 고른다.
  const sameDay = matched.find(
    (item) => toIsoFromApiDateTime(item.scheduleDateTime)?.startsWith(scheduledDay) === true,
  )

  return toFlightStatus(sameDay ?? matched[0])
}

export const incheonFlightStatusProvider: FlightStatusProvider = {
  provider: '인천국제공항공사',
  supportedAirportCodes: [INCHEON_AIRPORT_CODE] as readonly AirportCode[],
  getIsAvailability,
  getFlightStatus: getIncheonFlightStatus,
}

export { FlightStatusKind }
