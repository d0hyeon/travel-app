import { TransportType } from '@waylog/domains/modules/transport'

// 교통편 하나가 갖는 값을 평평하게 든다. 입력 중에 종류가 바뀔 수 있어,
// 판별 유니온으로 들면 종류를 바꿀 때마다 이미 적은 값이 통째로 날아간다.
// 종류별로 갈리는 제약은 전송 시점에 TripTransportCarrier 로 접으며 회복한다.
export interface TransportFormValues {
  type: typeof TransportType.항공 | typeof TransportType.기차 | typeof TransportType.버스
  departureName: string
  arrivalName: string
  /** 항공만 갖는다. 목록에서 고른 경우에만 채워진다. */
  departureAirportCode?: string
  arrivalAirportCode?: string
  departureAt: string
  arrivalAt?: string
  departureTimezone?: string
  arrivalTimezone?: string
  airline?: string
  airlineCode?: string
  flightNumber?: string
}
