import type { TripTransport } from '../trip-transport'
import type { RouteItem, RoutePlace } from './routeItem.types'

// 사용자가 편집한 경로를 시스템이 건드리지 않는다. 출발·도착이 인접하지 않으면
// 접지 않고 그 교통편을 리스트에서 제외한다 -- 공항을 다시 붙이면 복구된다.
export function toRouteItems(places: RoutePlace[], transports: TripTransport[]): RouteItem[] {
  const items: RouteItem[] = []

  for (let index = 0; index < places.length; index += 1) {
    const place = places[index]
    const next = places[index + 1]

    const boardingTransport =
      next &&
      transports.find(
        (x) => x.departureTripPlaceId === place.id && x.arrivalTripPlaceId === next.id
      )

    if (boardingTransport) {
      items.push({
        kind: 'transport',
        id: boardingTransport.id,
        transport: boardingTransport,
        departure: place,
        arrival: next
      })
      index += 1
      continue
    }

    items.push({ kind: 'place', id: place.id, place })
  }

  return items
}

export function toPlaceIds(items: RouteItem[]): string[] {
  return items.flatMap((item) =>
    item.kind === 'transport' ? [item.departure.id, item.arrival.id] : [item.place.id]
  )
}
