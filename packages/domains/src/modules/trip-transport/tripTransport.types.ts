import type { TransportType } from '../transport'

export type TripTransportType = Extract<TransportType, 'flight' | 'train' | 'bus'>

// 한 행이 탑승자 한 명의 탑승권 한 장이다. 여러 장이면 행을 나눈다.
export interface TripTransportTicket {
  id: string
  transportId: string
  memberId?: string
  image: string
  seat?: string
  terminal?: string
  gate?: string
  createdAt: string
}

type TripTransportBase = {
  id: string
  tripId: string

  departureName: string
  arrivalName: string
  departureAirportCode?: string
  arrivalAirportCode?: string
  departureAt: string
  arrivalAt?: string
  departureTimezone?: string
  arrivalTimezone?: string

  tickets: TripTransportTicket[]
  createdAt: string
}

// 종류마다 입력 필드가 다르다. 전부 옵셔널인 평평한 타입은
// "기차인데 airline 이 있는" 상태를 막지 못한다.
export type TripTransportCarrier =
  | {
      type: Extract<TripTransportType, 'flight'>
      airline?: string
      airlineCode?: string
      flightNumber?: string
    }
  | { type: Extract<TripTransportType, 'train' | 'bus'> }

export type TripTransport = TripTransportBase & TripTransportCarrier
