import type { TripPlace } from '../place'
import type { TripTransport } from '../trip-transport'

export type RoutePlace = TripPlace & {
  routeNotes: string[]
}

// 교통편은 출발지·도착지가 한 세트로 움직여야 한다. 그 블록 앞뒤로는
// 장소를 자유롭게 넣고 뺄 수 있지만 블록 사이에는 끼어들 수 없다.
// 검사로 막는 대신 두 장소를 한 항목으로 접어, 드롭 지점 자체를 없앤다.
export type RouteItem =
  | {
      kind: 'place'
      id: string
      place: RoutePlace
    }
  | {
      kind: 'transport'
      id: string
      transport: TripTransport
      departure: RoutePlace
      arrival: RoutePlace
    }
