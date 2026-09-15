import { describe, expect, it } from 'vitest'
import { toPlaceIds, toRouteItems } from '../routeItem.utils'
import type { RoutePlace } from '../routeItem.types'
import type { TripTransport } from '../../trip-transport'

function createPlace(id: string): RoutePlace {
  return {
    id,
    placeId: `place-${id}`,
    tripId: 'trip-1',
    name: id,
    address: '',
    lat: 0,
    lng: 0,
    status: 'wished',
    tags: [],
    memo: '',
    createdAt: '2026-09-15T00:00:00Z',
    routeNotes: []
  }
}

function createTransport(
  id: string,
  departureTripPlaceId: string,
  arrivalTripPlaceId: string
): TripTransport {
  return {
    id,
    tripId: 'trip-1',
    type: 'flight',
    departureTripPlaceId,
    arrivalTripPlaceId,
    departureAt: '2026-09-15T01:00:00Z',
    tickets: [],
    createdAt: '2026-09-15T00:00:00Z'
  }
}

const 숙소 = createPlace('숙소')
const 인천공항 = createPlace('인천공항')
const 오사카공항 = createPlace('오사카공항')
const 오사카성 = createPlace('오사카성')

describe('toRouteItems', () => {
  it('교통편의 출발·도착이 인접하면 하나의 블록으로 접는다', () => {
    const 항공편 = createTransport('t1', 인천공항.id, 오사카공항.id)

    const items = toRouteItems([숙소, 인천공항, 오사카공항, 오사카성], [항공편])

    expect(items).toEqual([
      { kind: 'place', id: 숙소.id, place: 숙소 },
      {
        kind: 'transport',
        id: 항공편.id,
        transport: 항공편,
        departure: 인천공항,
        arrival: 오사카공항
      },
      { kind: 'place', id: 오사카성.id, place: 오사카성 }
    ])
  })

  it('교통편이 없으면 모두 장소 항목이다', () => {
    const items = toRouteItems([숙소, 오사카성], [])

    expect(items).toEqual([
      { kind: 'place', id: 숙소.id, place: 숙소 },
      { kind: 'place', id: 오사카성.id, place: 오사카성 }
    ])
  })

  it('출발·도착이 떨어져 있으면 접지 않고 교통편을 제외한다', () => {
    const 항공편 = createTransport('t1', 인천공항.id, 오사카공항.id)

    const items = toRouteItems([인천공항, 숙소, 오사카공항], [항공편])

    expect(items).toEqual([
      { kind: 'place', id: 인천공항.id, place: 인천공항 },
      { kind: 'place', id: 숙소.id, place: 숙소 },
      { kind: 'place', id: 오사카공항.id, place: 오사카공항 }
    ])
  })

  it('경로에 없는 교통편은 무시한다', () => {
    const 항공편 = createTransport('t1', 인천공항.id, 오사카공항.id)

    const items = toRouteItems([숙소, 오사카성], [항공편])

    expect(items).toEqual([
      { kind: 'place', id: 숙소.id, place: 숙소 },
      { kind: 'place', id: 오사카성.id, place: 오사카성 }
    ])
  })

  it('접은 뒤에도 장소 순서가 유지된다', () => {
    const 항공편 = createTransport('t1', 인천공항.id, 오사카공항.id)

    const items = toRouteItems([숙소, 인천공항, 오사카공항, 오사카성], [항공편])

    expect(toPlaceIds(items)).toEqual([숙소.id, 인천공항.id, 오사카공항.id, 오사카성.id])
  })

  it('교통편이 여럿이면 각각 접는다', () => {
    const 오사카역 = createPlace('오사카역')
    const 교토역 = createPlace('교토역')
    const 항공편 = createTransport('t1', 인천공항.id, 오사카공항.id)
    const 기차편 = createTransport('t2', 오사카역.id, 교토역.id)

    const items = toRouteItems([인천공항, 오사카공항, 오사카역, 교토역], [항공편, 기차편])

    expect(items.map((x) => x.id)).toEqual([항공편.id, 기차편.id])
  })

  it('도착이 출발보다 앞에 놓이면 접지 않는다', () => {
    const 항공편 = createTransport('t1', 인천공항.id, 오사카공항.id)

    const items = toRouteItems([오사카공항, 인천공항], [항공편])

    expect(items).toEqual([
      { kind: 'place', id: 오사카공항.id, place: 오사카공항 },
      { kind: 'place', id: 인천공항.id, place: 인천공항 }
    ])
  })
})

describe('toPlaceIds', () => {
  it('교통 블록을 출발·도착 두 id로 편다', () => {
    const 항공편 = createTransport('t1', 인천공항.id, 오사카공항.id)

    const ids = toPlaceIds([
      {
        kind: 'transport',
        id: 항공편.id,
        transport: 항공편,
        departure: 인천공항,
        arrival: 오사카공항
      }
    ])

    expect(ids).toEqual([인천공항.id, 오사카공항.id])
  })

  it('toRouteItems 를 거쳐도 원래 placeIds 를 복원한다', () => {
    const 항공편 = createTransport('t1', 인천공항.id, 오사카공항.id)
    const places = [숙소, 인천공항, 오사카공항, 오사카성]

    expect(toPlaceIds(toRouteItems(places, [항공편]))).toEqual(places.map((x) => x.id))
  })
})
