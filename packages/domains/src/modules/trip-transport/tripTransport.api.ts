import { assert } from '@waylog/utility'
import { supabase } from '../../gateways/client'
import type { UpdateDataType } from '../../gateways/client'
import { TransportType } from '../transport'
import type { TicketInfo } from './ticketInfo.utils'
import type {
  TripTransport,
  TripTransportCarrier,
  TripTransportTicket,
} from './tripTransport.types'

type RawTicket = {
  id: string
  transport_id: string
  member_id: string | null
  image: string | null
  seat: string | null
  terminal: string | null
  gate: string | null
  created_at: string
}

type RawData = {
  id: string
  trip_id: string
  type: string
  departure_name: string
  arrival_name: string
  departure_airport_code: string | null
  arrival_airport_code: string | null
  departure_at: string
  arrival_at: string | null
  departure_timezone: string | null
  arrival_timezone: string | null
  airline: string | null
  airline_code: string | null
  flight_number: string | null
  provider: string | null
  service_number: string | null
  created_at: string
  trip_transport_tickets: RawTicket[]
}

const TRIP_TRANSPORT_SELECT = `
  id, trip_id, type,
  departure_name, arrival_name,
  departure_airport_code, arrival_airport_code,
  departure_at, arrival_at, departure_timezone, arrival_timezone,
  airline, airline_code, flight_number, provider, service_number, created_at,
  trip_transport_tickets(id, transport_id, member_id, image, seat, terminal, gate, created_at)
` as const

// 이미지 없는 행은 열어볼 것이 없어 티켓으로 쓸 수 없다. 조회에서 걸러낸다.
function toTicket(row: RawTicket): TripTransportTicket[] {
  if (row.image == null) return []

  return [
    {
      id: row.id,
      transportId: row.transport_id,
      memberId: row.member_id ?? undefined,
      image: row.image,
      seat: row.seat ?? undefined,
      terminal: row.terminal ?? undefined,
      gate: row.gate ?? undefined,
      createdAt: row.created_at,
    },
  ]
}

// DB 는 종류별 컬럼이 모두 nullable 이라 type 을 좁혀야 어느 필드가 유효한지 정해진다.
function toData(row: RawData): TripTransport {
  const base = {
    id: row.id,
    tripId: row.trip_id,
    departureName: row.departure_name,
    arrivalName: row.arrival_name,
    departureAirportCode: row.departure_airport_code ?? undefined,
    arrivalAirportCode: row.arrival_airport_code ?? undefined,
    departureAt: row.departure_at,
    arrivalAt: row.arrival_at ?? undefined,
    departureTimezone: row.departure_timezone ?? undefined,
    arrivalTimezone: row.arrival_timezone ?? undefined,
    tickets: (row.trip_transport_tickets ?? []).flatMap(toTicket),
    createdAt: row.created_at,
  }

  if (row.type === TransportType.항공) {
    return {
      ...base,
      type: TransportType.항공,
      airline: row.airline ?? undefined,
      airlineCode: row.airline_code ?? undefined,
      flightNumber: row.flight_number ?? undefined,
    }
  }

  return {
    ...base,
    type: row.type === TransportType.기차 ? TransportType.기차 : TransportType.버스,
    provider: row.provider ?? undefined,
    serviceNumber: row.service_number ?? undefined,
  }
}

export const path = 'trip_transports'

export async function getTripTransports(tripId: string): Promise<TripTransport[]> {
  const { data, error } = await supabase
    .from('trip_transports')
    .select(TRIP_TRANSPORT_SELECT)
    .eq('trip_id', tripId)
    .order('departure_at', { ascending: true })

  if (error) throw error
  return data.map(toData)
}

type MutableSchedule = {
  departureName: string
  arrivalName: string
  departureAirportCode?: string
  arrivalAirportCode?: string
  departureAt: string
  arrivalAt?: string
  departureTimezone?: string
  arrivalTimezone?: string
}

export type CreateTripTransport = MutableSchedule & { tripId: string } & TripTransportCarrier

// 종류가 갖지 않는 컬럼은 null 로 눌러, 종류를 바꿔도 이전 값이 남지 않는다.
function toCarrierColumns(data: TripTransportCarrier) {
  if (data.type === TransportType.항공) {
    return {
      airline: data.airline ?? null,
      airline_code: data.airlineCode ?? null,
      flight_number: data.flightNumber ?? null,
      provider: null,
      service_number: null,
    }
  }

  return {
    airline: null,
    airline_code: null,
    flight_number: null,
    provider: data.provider ?? null,
    service_number: data.serviceNumber ?? null,
  }
}

export async function createTripTransport(data: CreateTripTransport) {
  const { data: created, error } = await supabase
    .from('trip_transports')
    .insert({
      trip_id: data.tripId,
      type: data.type,
      departure_name: data.departureName,
      arrival_name: data.arrivalName,
      departure_airport_code: data.departureAirportCode ?? null,
      arrival_airport_code: data.arrivalAirportCode ?? null,
      departure_at: data.departureAt,
      arrival_at: data.arrivalAt ?? null,
      departure_timezone: data.departureTimezone ?? null,
      arrival_timezone: data.arrivalTimezone ?? null,
      ...toCarrierColumns(data),
    })
    .select(TRIP_TRANSPORT_SELECT)
    .single()

  if (error) throw error
  return toData(created!)
}

// 운항 정보는 종류와 함께 와야 어느 컬럼을 채울지 정해지므로, carrier 를 통째로 받는다.
// 일정만 고칠 때는 생략한다 -- 종류를 모르는 채 운항 컬럼을 건드릴 수 없다.
export type UpdateTripTransport = Partial<MutableSchedule> & {
  id: string
  carrier?: TripTransportCarrier
}

export async function updateTripTransport({ id, carrier, ...data }: UpdateTripTransport) {
  const payload: Record<string, unknown> = carrier
    ? { type: carrier.type, ...toCarrierColumns(carrier) }
    : {}

  if (data.departureName !== undefined) payload.departure_name = data.departureName
  if (data.arrivalName !== undefined) payload.arrival_name = data.arrivalName
  if (data.departureAirportCode !== undefined)
    payload.departure_airport_code = data.departureAirportCode
  if (data.arrivalAirportCode !== undefined)
    payload.arrival_airport_code = data.arrivalAirportCode
  if (data.departureAt !== undefined) payload.departure_at = data.departureAt
  if (data.arrivalAt !== undefined) payload.arrival_at = data.arrivalAt
  if (data.departureTimezone !== undefined) payload.departure_timezone = data.departureTimezone
  if (data.arrivalTimezone !== undefined) payload.arrival_timezone = data.arrivalTimezone

  const { data: updated, error } = await supabase
    .from('trip_transports')
    .update(payload as UpdateDataType<'trip_transports'>)
    .eq('id', id)
    .select(TRIP_TRANSPORT_SELECT)
    .single()

  if (error) throw error
  return toData(updated!)
}

export async function removeTripTransport(id: string) {
  const { error } = await supabase.from('trip_transports').delete().eq('id', id)

  if (error) throw error
}

export type CreateTripTransportTicket = {
  transportId: string
  memberId?: string
  image: string
}

export async function createTripTransportTicket(data: CreateTripTransportTicket) {
  const { data: created, error } = await supabase
    .from('trip_transport_tickets')
    .insert({
      transport_id: data.transportId,
      member_id: data.memberId ?? null,
      image: data.image,
    })
    .select()
    .single()

  if (error) throw error

  const [ticket] = toTicket(created!)
  assert(ticket != null, '티켓을 생성하지 못했습니다.')
  return ticket
}

export type UpdateTripTransportTicket = { id: string } & TicketInfo

// 넘어온 키만 쓴다. 세 컬럼을 늘 쓰면 게이트만 고쳐도 좌석이 지워진다.
export async function updateTripTransportTicket({ id, ...info }: UpdateTripTransportTicket) {
  const payload: UpdateDataType<'trip_transport_tickets'> = {}
  if ('seat' in info) payload.seat = info.seat ?? null
  if ('terminal' in info) payload.terminal = info.terminal ?? null
  if ('gate' in info) payload.gate = info.gate ?? null

  const { data: updated, error } = await supabase
    .from('trip_transport_tickets')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  const [ticket] = toTicket(updated!)
  assert(ticket != null, '티켓을 수정하지 못했습니다.')
  return ticket
}

export async function removeTripTransportTicket(id: string) {
  const { error } = await supabase.from('trip_transport_tickets').delete().eq('id', id)

  if (error) throw error
}
