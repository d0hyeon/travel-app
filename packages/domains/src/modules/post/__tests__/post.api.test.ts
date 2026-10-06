import { describe, it, expect } from 'vitest'
import { toPost, type PostRpcRow } from '../post.api'

const makeRow = (overrides: Partial<PostRpcRow> = {}): PostRpcRow => ({
  id: 'post-1',
  author_id: 'author-1',
  trip_id: null,
  title: '제목',
  description: null,
  visibility: 'PUBLIC',
  like_count: 3,
  liked_by_me: true,
  created_at: '2026-10-01T00:00:00Z',
  updated_at: null,
  photos: [],
  places: [],
  ...overrides,
})

describe('toPost', () => {
  it('좋아요 수와 내가 좋아요했는지를 그대로 담는다', () => {
    const post = toPost(makeRow({ like_count: 7, liked_by_me: false }))

    expect(post.likeCount).toBe(7)
    expect(post.likedByMe).toBe(false)
  })

  it('사진의 서버 순서를 유지하며 도메인 모델로 변환한다', () => {
    const post = toPost(makeRow({
      photos: [
        { url: 'a', storage_path: 'pa', place_id: 'place-1', is_public: true },
        { url: 'b', storage_path: 'pb', place_id: null, is_public: false },
      ],
    }))

    expect(post.photos).toEqual([
      { url: 'a', storagePath: 'pa', placeId: 'place-1', isPublic: true },
      { url: 'b', storagePath: 'pb', placeId: null, isPublic: false },
    ])
  })

  it('장소의 서버 순서를 유지하며 도메인 모델로 변환한다', () => {
    const post = toPost(makeRow({
      places: [
        { place_id: 'place-2', name: '둘째', lat: 1, lng: 2, address: null },
        { place_id: 'place-1', name: '첫째', lat: 3, lng: 4, address: '주소' },
      ],
    }))

    expect(post.places.map((place) => place.placeId)).toEqual(['place-2', 'place-1'])
    expect(post.places[1]).toEqual({ placeId: 'place-1', name: '첫째', lat: 3, lng: 4, address: '주소' })
  })

  it('포스트 필드를 camelCase 로 옮긴다', () => {
    const post = toPost(makeRow({ trip_id: 'trip-1', updated_at: '2026-10-02T00:00:00Z' }))

    expect(post).toMatchObject({
      id: 'post-1',
      authorId: 'author-1',
      tripId: 'trip-1',
      createdAt: '2026-10-01T00:00:00Z',
      updatedAt: '2026-10-02T00:00:00Z',
    })
  })
})
