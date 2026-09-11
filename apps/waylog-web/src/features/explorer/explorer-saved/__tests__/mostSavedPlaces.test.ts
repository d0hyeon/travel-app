import { describe, expect, it } from 'vitest'
import type { MostSavedPlace } from '../../explorer.api'
import { bySaveRank } from '../mostSavedPlaces.utils'

function createPlace(place: Pick<MostSavedPlace, 'name' | 'saveCount' | 'lastSavedAt'>): MostSavedPlace {
  return {
    placeId: place.name,
    address: '',
    lat: 0,
    lng: 0,
    destinations: [],
    categories: [],
    ...place,
  }
}

describe('bySaveRank', () => {
  it('저장 수가 많은 장소가 앞선다', () => {
    const places = [
      createPlace({ name: '적게', saveCount: 3, lastSavedAt: '2026-09-11T00:00:00Z' }),
      createPlace({ name: '많이', saveCount: 9, lastSavedAt: '2026-01-01T00:00:00Z' }),
    ]

    expect(places.toSorted(bySaveRank).map((place) => place.name)).toEqual(['많이', '적게'])
  })

  it('저장 수가 같으면 최근에 저장된 장소가 앞선다', () => {
    const places = [
      createPlace({ name: '오래된', saveCount: 5, lastSavedAt: '2026-01-01T00:00:00Z' }),
      createPlace({ name: '최근', saveCount: 5, lastSavedAt: '2026-09-11T00:00:00Z' }),
    ]

    expect(places.toSorted(bySaveRank).map((place) => place.name)).toEqual(['최근', '오래된'])
  })

  it('저장 수와 저장 시각이 모두 같으면 순서를 바꾸지 않는다', () => {
    const places = [
      createPlace({ name: '먼저', saveCount: 5, lastSavedAt: '2026-09-11T00:00:00Z' }),
      createPlace({ name: '나중', saveCount: 5, lastSavedAt: '2026-09-11T00:00:00Z' }),
    ]

    expect(places.toSorted(bySaveRank).map((place) => place.name)).toEqual(['먼저', '나중'])
  })

  it('저장 시각이 아직 없으면 저장 수 순서를 유지한다', () => {
    const places = [
      createPlace({ name: '먼저', saveCount: 5, lastSavedAt: undefined }),
      createPlace({ name: '나중', saveCount: 5, lastSavedAt: undefined }),
      createPlace({ name: '많이', saveCount: 9, lastSavedAt: undefined }),
    ]

    expect(places.toSorted(bySaveRank).map((place) => place.name)).toEqual(['많이', '먼저', '나중'])
  })
})
