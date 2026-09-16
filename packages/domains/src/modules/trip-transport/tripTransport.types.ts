import type { TransportType } from '../transport'

export type TripTransportType = Extract<TransportType, 'flight' | 'train' | 'bus'>

export interface TripTransportTicket {
  id: string
  transportId: string
  memberId?: string
  images: string[]
  createdAt: string
}

type TripTransportBase = {
  id: string
  tripId: string

  departureName: string
  arrivalName: string
  departureAt: string
  arrivalAt?: string
  departureTimezone?: string
  arrivalTimezone?: string

  tickets: TripTransportTicket[]
  createdAt: string
}

// 종류마다 입력 필드가 다르다. 전부 옵셔널인 평평한 타입은
// "기차인데 airline 이 있는" 상태를 막지 못한다.
// 기차와 버스는 필드가 같아 둘로 나눈다 -- 갈라지면 그때 쪼갠다.
export type TripTransportCarrier =
  | {
      type: Extract<TripTransportType, 'flight'>
      airline?: string
      flightNumber?: string
    }
  | {
      type: Extract<TripTransportType, 'train' | 'bus'>
      provider?: string
      serviceNumber?: string
    }

export type TripTransport = TripTransportBase & TripTransportCarrier
