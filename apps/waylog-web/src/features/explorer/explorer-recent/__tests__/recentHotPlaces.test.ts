import { describe, expect, it } from 'vitest'
import type { ExploredPlace } from '../../explorer.api'
import { byHotRank } from '../recentHotPlaces.utils'

function createPlace(place: Pick<ExploredPlace, 'name' | 'score' | 'lastSavedAt'>): ExploredPlace {
  return {
    placeId: place.name,
    address: '',
    lat: 0,
    lng: 0,
    visitorCount: 1,
    photoCount: 0,
    postCount: 0,
    destinations: [],
    categories: [],
    ...place,
  }
}

describe('byHotRank', () => {
  it('점수가 높은 장소가 앞선다', () => {
    const places = [
      createPlace({ name: '낮은', score: 0.6, lastSavedAt: '2026-09-10T00:00:00Z' }),
      createPlace({ name: '높은', score: 1, lastSavedAt: '2026-01-01T00:00:00Z' }),
    ]

    expect(places.toSorted(byHotRank).map((place) => place.name)).toEqual(['높은', '낮은'])
  })

  it('점수가 같으면 최근에 담긴 장소가 앞선다', () => {
    const places = [
      createPlace({ name: '제주', score: 0.6, lastSavedAt: '2026-06-01T00:00:00Z' }),
      createPlace({ name: '울진', score: 0.6, lastSavedAt: '2026-08-26T00:00:00Z' }),
      createPlace({ name: '춘천', score: 0.6, lastSavedAt: '2026-07-15T00:00:00Z' }),
    ]

    expect(places.toSorted(byHotRank).map((place) => place.name)).toEqual(['울진', '춘천', '제주'])
  })

  it('담긴 시각이 아직 없으면 점수 순서를 유지한다', () => {
    const places = [
      createPlace({ name: '먼저', score: 0.6, lastSavedAt: undefined }),
      createPlace({ name: '나중', score: 0.6, lastSavedAt: undefined }),
      createPlace({ name: '높은', score: 1, lastSavedAt: undefined }),
    ]

    expect(places.toSorted(byHotRank).map((place) => place.name)).toEqual(['높은', '먼저', '나중'])
  })
})
