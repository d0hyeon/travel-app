import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createTripPlace, upsertPlace } from '../place.api'

const from = vi.fn()

vi.mock('../../../gateways/client', () => ({
  supabase: { from: (...args: unknown[]) => from(...args) },
}))

const placeRow = {
  id: 'p1',
  name: '서울숲',
  address: '서울',
  lat: 37.5,
  lng: 127.0,
  provider: 'kakao',
  external_id: 'k1',
  category: null as string | null,
  created_at: '2026-10-01T00:00:00Z',
}

const placeData = { name: '서울숲', address: '서울', lat: 37.5, lng: 127.0 }

function chain(result: { data: unknown; error: unknown }) {
  const builder: Record<string, unknown> = {}
  const passthrough = ['select', 'eq', 'is', 'update', 'upsert', 'order']
  passthrough.forEach((method) => {
    builder[method] = vi.fn(() => builder)
  })
  builder.single = vi.fn(() => Promise.resolve(result))
  builder.then = (resolve: (value: unknown) => unknown) => Promise.resolve(result).then(resolve)
  return builder
}

beforeEach(() => from.mockReset())

describe('upsertPlace — category', () => {
  it('신규 장소에 category를 저장한다', async () => {
    const upsertBuilder = chain({ data: [{ ...placeRow, category: 'park' }], error: null })
    from.mockReturnValueOnce(upsertBuilder)

    const place = await upsertPlace('kakao', 'k1', { ...placeData, category: 'park' })

    expect(upsertBuilder.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ category: 'park' }),
      expect.anything(),
    )
    expect(place.category).toBe('park')
  })

  it('기존 장소의 category가 비어 있으면 patch한다', async () => {
    const upsertBuilder = chain({ data: [], error: null })
    const selectBuilder = chain({ data: placeRow, error: null })
    const patchBuilder = chain({ data: [{ ...placeRow, category: 'park' }], error: null })
    from.mockReturnValueOnce(upsertBuilder).mockReturnValueOnce(selectBuilder).mockReturnValueOnce(patchBuilder)

    const place = await upsertPlace('kakao', 'k1', { ...placeData, category: 'park' })

    expect(patchBuilder.update).toHaveBeenCalledWith({ category: 'park' })
    expect(patchBuilder.eq).toHaveBeenCalledWith('id', 'p1')
    expect(patchBuilder.is).toHaveBeenCalledWith('category', null)
    expect(place.category).toBe('park')
  })

  it('patch가 경쟁에서 져서 0행이면 다시 조회해 최신 category를 반환한다', async () => {
    const upsertBuilder = chain({ data: [], error: null })
    const selectBuilder = chain({ data: placeRow, error: null })
    const patchBuilder = chain({ data: [], error: null })
    const reselectBuilder = chain({ data: { ...placeRow, category: 'cafe' }, error: null })
    from
      .mockReturnValueOnce(upsertBuilder)
      .mockReturnValueOnce(selectBuilder)
      .mockReturnValueOnce(patchBuilder)
      .mockReturnValueOnce(reselectBuilder)

    const place = await upsertPlace('kakao', 'k1', { ...placeData, category: 'park' })

    expect(place.category).toBe('cafe')
  })

  it('기존 장소의 category가 있으면 덮어쓰지 않는다', async () => {
    const upsertBuilder = chain({ data: [], error: null })
    const selectBuilder = chain({ data: { ...placeRow, category: 'cafe' }, error: null })
    from.mockReturnValueOnce(upsertBuilder).mockReturnValueOnce(selectBuilder)

    const place = await upsertPlace('kakao', 'k1', { ...placeData, category: 'park' })

    expect(from).toHaveBeenCalledTimes(2)
    expect(place.category).toBe('cafe')
  })

  it('넘어온 category가 없으면 patch하지 않는다', async () => {
    const upsertBuilder = chain({ data: [], error: null })
    const selectBuilder = chain({ data: placeRow, error: null })
    from.mockReturnValueOnce(upsertBuilder).mockReturnValueOnce(selectBuilder)

    const place = await upsertPlace('kakao', 'k1', placeData)

    expect(from).toHaveBeenCalledTimes(2)
    expect(place.category).toBeUndefined()
  })
})

describe('createTripPlace — category 상속', () => {
  const tripPlaceRow = (category: string | null) => ({
    id: 'tp1',
    trip_id: 't1',
    place_id: 'p1',
    status: 'wished',
    category,
    memo: null,
    tags: [],
    created_at: '2026-10-01T00:00:00Z',
    places: { name: '서울숲', address: '서울', lat: 37.5, lng: 127.0 },
  })

  it('category를 생략하면 place의 category를 상속한다', async () => {
    const placeBuilder = chain({ data: { ...placeRow, category: 'park' }, error: null })
    const tripPlaceBuilder = chain({ data: [tripPlaceRow('park')], error: null })
    from.mockReturnValueOnce(placeBuilder).mockReturnValueOnce(tripPlaceBuilder)

    await createTripPlace({ tripId: 't1', placeId: 'p1' })

    expect(tripPlaceBuilder.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ category: 'park' }),
      expect.anything(),
    )
  })

  it('명시한 category가 place의 category보다 우선한다', async () => {
    const placeBuilder = chain({ data: { ...placeRow, category: 'park' }, error: null })
    const tripPlaceBuilder = chain({ data: [tripPlaceRow('cafe')], error: null })
    from.mockReturnValueOnce(placeBuilder).mockReturnValueOnce(tripPlaceBuilder)

    await createTripPlace({ tripId: 't1', placeId: 'p1', category: 'cafe' })

    expect(tripPlaceBuilder.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ category: 'cafe' }),
      expect.anything(),
    )
  })

  it('place 조회에 실패하면 trip_places에 쓰지 않고 에러를 던진다', async () => {
    from.mockReturnValueOnce(chain({ data: null, error: new Error('place not found') }))

    await expect(createTripPlace({ tripId: 't1', placeId: 'p1' })).rejects.toThrow('place not found')

    expect(from).toHaveBeenCalledTimes(1)
  })

  it('place에도 category가 없으면 null로 저장한다', async () => {
    const placeBuilder = chain({ data: placeRow, error: null })
    const tripPlaceBuilder = chain({ data: [tripPlaceRow(null)], error: null })
    from.mockReturnValueOnce(placeBuilder).mockReturnValueOnce(tripPlaceBuilder)

    await createTripPlace({ tripId: 't1', placeId: 'p1' })

    expect(tripPlaceBuilder.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ category: null }),
      expect.anything(),
    )
  })
})
