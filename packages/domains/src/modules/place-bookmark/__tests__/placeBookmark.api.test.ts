import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  addPlaceBookmark,
  getBookmarkedPlaces,
  removePlaceBookmark,
} from '../placeBookmark.api'

vi.mock('../../../gateways/client', () => ({
  supabase: { from: vi.fn() },
}))
vi.mock('../../../gateways/auth', () => ({
  getSession: vi.fn(),
}))

import { getSession } from '../../../gateways/auth'
import { supabase } from '../../../gateways/client'

const mockFrom = vi.mocked(supabase.from)

function placeRow(id: string) {
  return {
    id,
    name: id,
    address: null,
    lat: 0,
    lng: 0,
    provider: 'kakao',
    external_id: id,
    category: null,
    created_at: '',
  }
}

function place(id: string) {
  return {
    id,
    name: id,
    address: '',
    lat: 0,
    lng: 0,
    provider: 'kakao',
    externalId: id,
    category: undefined,
    createdAt: '',
  }
}

beforeEach(() => {
  mockFrom.mockReset()
  vi.mocked(getSession).mockReturnValue({ id: 'me' })
})

describe('addPlaceBookmark', () => {
  it('로그인 사용자와 장소를 place_bookmarks 에 저장한다', async () => {
    const insert = vi.fn().mockResolvedValue({ error: null })
    mockFrom.mockReturnValue({ insert } as never)

    await addPlaceBookmark('place-1')

    expect(mockFrom).toHaveBeenCalledWith('place_bookmarks')
    expect(insert).toHaveBeenCalledWith({ user_id: 'me', place_id: 'place-1' })
  })

  it('이미 북마크한 장소면 성공으로 처리한다', async () => {
    const insert = vi.fn().mockResolvedValue({ error: { code: '23505', message: 'duplicate key' } })
    mockFrom.mockReturnValue({ insert } as never)

    await expect(addPlaceBookmark('place-1')).resolves.toBeUndefined()
  })

  it('그 외 에러는 그대로 던진다', async () => {
    const insert = vi.fn().mockResolvedValue({ error: { code: '42501', message: 'denied' } })
    mockFrom.mockReturnValue({ insert } as never)

    await expect(addPlaceBookmark('place-1')).rejects.toMatchObject({ code: '42501' })
  })

  it('세션이 없으면 인증 만료 에러를 던진다', async () => {
    vi.mocked(getSession).mockReturnValue(null)

    await expect(addPlaceBookmark('place-1')).rejects.toThrow('인증 정보가 만료되었습니다.')
    expect(mockFrom).not.toHaveBeenCalled()
  })
})

describe('removePlaceBookmark', () => {
  it('내 북마크만 삭제한다', async () => {
    const secondEq = vi.fn().mockResolvedValue({ error: null })
    const firstEq = vi.fn().mockReturnValue({ eq: secondEq })
    const deleteRows = vi.fn().mockReturnValue({ eq: firstEq })
    mockFrom.mockReturnValue({ delete: deleteRows } as never)

    await removePlaceBookmark('place-1')

    expect(mockFrom).toHaveBeenCalledWith('place_bookmarks')
    expect(firstEq).toHaveBeenCalledWith('user_id', 'me')
    expect(secondEq).toHaveBeenCalledWith('place_id', 'place-1')
  })
})

describe('getBookmarkedPlaces', () => {
  it('북마크한 장소를 한 번의 요청으로 최근 북마크한 순서대로 돌려준다', async () => {
    const order = vi.fn().mockResolvedValue({ data: [{ places: placeRow('b') }, { places: placeRow('a') }], error: null })
    const select = vi.fn().mockReturnValue({ order })
    mockFrom.mockReturnValue({ select } as never)

    const places = await getBookmarkedPlaces()

    expect(mockFrom).toHaveBeenCalledTimes(1)
    expect(select).toHaveBeenCalledWith('places(*)')
    expect(order).toHaveBeenCalledWith('created_at', { ascending: false })
    expect(places).toEqual([place('b'), place('a')])
  })

  it('비로그인이면 쿼리 없이 빈 배열을 돌려준다', async () => {
    vi.mocked(getSession).mockReturnValue(null)

    await expect(getBookmarkedPlaces()).resolves.toEqual([])
    expect(mockFrom).not.toHaveBeenCalled()
  })
})
