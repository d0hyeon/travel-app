import { describe, expect, it, vi } from 'vitest'
import { withPersistentCache, type PersistentStorage } from './withPersistentCache'

function createMemoryStorage(initial: Record<string, string> = {}) {
  const entries = new Map(Object.entries(initial))
  const storage: PersistentStorage = {
    get: vi.fn(async (key: string) => entries.get(key) ?? null),
    set: vi.fn(async (key: string, value: string) => {
      entries.set(key, value)
    }),
  }
  return { storage, entries }
}

const key = (name: string) => `place:${name}`

describe('withPersistentCache', () => {
  it('저장본이 없으면 load 결과를 돌려주고 저장한다', async () => {
    const { storage, entries } = createMemoryStorage()
    const load = vi.fn(async (name: string) => [name])
    const cached = withPersistentCache(load, { storage, key })

    expect(await cached('seoul')).toEqual(['seoul'])
    expect(entries.get('place:seoul')).toBe(JSON.stringify(['seoul']))
  })

  it('저장본이 있으면 load 를 기다리지 않고 저장본을 돌려준다', async () => {
    const { storage } = createMemoryStorage({ 'place:seoul': JSON.stringify(['stored']) })
    const load = vi.fn((_name: string) => new Promise<string[]>(() => {}))
    const cached = withPersistentCache(load, { storage, key })

    expect(await cached('seoul')).toEqual(['stored'])
  })

  it('저장본이 있으면 뒤에서 load 해 새 결과로 저장본을 갱신한다', async () => {
    const { storage, entries } = createMemoryStorage({ 'place:seoul': JSON.stringify(['stored']) })
    const load = vi.fn(async (_name: string) => ['fresh'])
    const cached = withPersistentCache(load, { storage, key })

    await cached('seoul')

    await vi.waitFor(() => expect(entries.get('place:seoul')).toBe(JSON.stringify(['fresh'])))
  })

  it('같은 키는 한 세션에 한 번만 갱신한다', async () => {
    const { storage } = createMemoryStorage({ 'place:seoul': JSON.stringify(['stored']) })
    const load = vi.fn(async (_name: string) => ['fresh'])
    const cached = withPersistentCache(load, { storage, key })

    await cached('seoul')
    await cached('seoul')
    await cached('seoul')

    expect(load).toHaveBeenCalledTimes(1)
  })

  it('저장 없이 받아온 키도 이후에는 다시 갱신하지 않는다', async () => {
    const { storage } = createMemoryStorage()
    const load = vi.fn(async (_name: string) => ['fresh'])
    const cached = withPersistentCache(load, { storage, key })

    await cached('seoul')
    await cached('seoul')

    expect(load).toHaveBeenCalledTimes(1)
  })

  it('키가 다르면 각각 갱신한다', async () => {
    const { storage } = createMemoryStorage({
      'place:seoul': JSON.stringify(['a']),
      'place:busan': JSON.stringify(['b']),
    })
    const load = vi.fn(async (name: string) => [name])
    const cached = withPersistentCache(load, { storage, key })

    await cached('seoul')
    await cached('busan')

    expect(load).toHaveBeenCalledTimes(2)
  })

  it('load 가 null 이면 저장하지 않는다', async () => {
    const { storage } = createMemoryStorage()
    const cached = withPersistentCache(async (_name: string) => null, { storage, key })

    expect(await cached('unknown')).toBeNull()
    expect(storage.set).not.toHaveBeenCalled()
  })

  it('갱신 결과가 null 이면 저장본을 지우지 않는다', async () => {
    const { storage, entries } = createMemoryStorage({ 'place:seoul': JSON.stringify(['stored']) })
    const load = vi.fn(async (_name: string) => null)
    const cached = withPersistentCache(load, { storage, key })

    await cached('seoul')
    await vi.waitFor(() => expect(load).toHaveBeenCalled())

    expect(entries.get('place:seoul')).toBe(JSON.stringify(['stored']))
  })

  it('저장본이 손상되면 load 결과로 돌아간다', async () => {
    const { storage } = createMemoryStorage({ 'place:seoul': '{broken' })
    const load = vi.fn(async (_name: string) => ['fresh'])
    const cached = withPersistentCache(load, { storage, key })

    expect(await cached('seoul')).toEqual(['fresh'])
  })

  it('저장소 읽기가 실패해도 load 결과로 돌아간다', async () => {
    const { storage } = createMemoryStorage()
    vi.mocked(storage.get).mockRejectedValue(new Error('read failed'))
    const cached = withPersistentCache(async (_name: string) => ['fresh'], { storage, key })

    expect(await cached('seoul')).toEqual(['fresh'])
  })

  it('저장소 쓰기가 실패해도 결과를 돌려준다', async () => {
    const { storage } = createMemoryStorage()
    vi.mocked(storage.set).mockRejectedValue(new Error('write failed'))
    const cached = withPersistentCache(async (_name: string) => ['fresh'], { storage, key })

    expect(await cached('seoul')).toEqual(['fresh'])
  })

  it('갱신이 실패해도 저장본 응답에는 영향이 없다', async () => {
    const { storage } = createMemoryStorage({ 'place:seoul': JSON.stringify(['stored']) })
    const load = vi.fn(async (_name: string) => {
      throw new Error('network failed')
    })
    const cached = withPersistentCache(load, { storage, key })

    expect(await cached('seoul')).toEqual(['stored'])
    await vi.waitFor(() => expect(load).toHaveBeenCalledTimes(1))
  })

  it('갱신이 실패한 키는 다음 호출에서 다시 시도한다', async () => {
    const { storage } = createMemoryStorage({ 'place:seoul': JSON.stringify(['stored']) })
    const load = vi
      .fn<(name: string) => Promise<string[]>>()
      .mockRejectedValueOnce(new Error('network failed'))
      .mockResolvedValue(['fresh'])
    const cached = withPersistentCache(load, { storage, key })

    await cached('seoul')
    await vi.waitFor(() => expect(load).toHaveBeenCalledTimes(1))
    await cached('seoul')

    await vi.waitFor(() => expect(load).toHaveBeenCalledTimes(2))
  })

  it('저장본이 없을 때 load 가 실패하면 에러를 그대로 전달한다', async () => {
    const { storage } = createMemoryStorage()
    const cached = withPersistentCache(async (_name: string) => {
      throw new Error('network failed')
    }, { storage, key })

    await expect(cached('seoul')).rejects.toThrow('network failed')
  })
})
