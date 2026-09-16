export const TRANSPORT_FORM_STEPS = ['type', 'detail', 'ticket'] as const
export type TransportFormStep = (typeof TRANSPORT_FORM_STEPS)[number]

// 폼은 평평하게 든다. 입력 중에 종류가 바뀔 수 있어, 판별 유니온으로 들면
// 종류를 바꿀 때마다 이미 적은 값이 통째로 날아간다.
// 제출 시점에 type 과 함께 유니온으로 접는다.
export interface TransportFormValues {
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
  provider?: string
  serviceNumber?: string
}
