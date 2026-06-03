import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getRoadDirections, getGlobalRoadDirections } from '../roadRoute.api'

const wp = (lat: number, lng: number) => ({ lat, lng })

const twoPoints = [wp(37.5, 127.0), wp(37.6, 127.1)]
const successBody = JSON.stringify({
  coordinates: [wp(37.5, 127.0), wp(37.55, 127.05), wp(37.6, 127.1)],
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockFetch: any

beforeEach(() => {
  mockFetch = vi.spyOn(globalThis, 'fetch')
})

afterEach(() => {
  mockFetch.mockRestore()
})

describe('getRoadDirections', () => {
  it('waypoints가 1개면 그대로 반환', async () => {
    const result = await getRoadDirections([wp(37.5, 127.0)])
    expect(result).toEqual([wp(37.5, 127.0)])
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('성공 시 coordinates 반환', async () => {
    mockFetch.mockResolvedValue(new Response(successBody, { status: 200 }))
    const result = await getRoadDirections(twoPoints)
    expect(result).toEqual([wp(37.5, 127.0), wp(37.55, 127.05), wp(37.6, 127.1)])
  })

  it('region=korea로 요청', async () => {
    mockFetch.mockResolvedValue(new Response(successBody, { status: 200 }))
    await getRoadDirections(twoPoints)
    const url = mockFetch.mock.calls[0][0] as string
    expect(url).toContain('region=korea')
  })

  it('waypoints가 쿼리스트링에 lng,lat 형식으로 직렬화됨', async () => {
    mockFetch.mockResolvedValue(new Response(successBody, { status: 200 }))
    await getRoadDirections(twoPoints)
    const url = mockFetch.mock.calls[0][0] as string
    expect(url).toContain('127.0%2C37.5') // lng,lat URL-encoded
  })

  it('API 오류 시 원본 waypoints 반환', async () => {
    mockFetch.mockResolvedValue(new Response('error', { status: 500 }))
    const result = await getRoadDirections(twoPoints)
    expect(result).toEqual(twoPoints)
  })

  it('fetch 예외 시 원본 waypoints 반환', async () => {
    mockFetch.mockImplementation(() => Promise.reject(new Error('network')))
    const result = await getRoadDirections(twoPoints)
    expect(result).toEqual(twoPoints)
  })
})

describe('getGlobalRoadDirections', () => {
  it('region=global로 요청', async () => {
    mockFetch.mockResolvedValue(new Response(successBody, { status: 200 }))
    await getGlobalRoadDirections(twoPoints)
    const url = mockFetch.mock.calls[0][0] as string
    expect(url).toContain('region=global')
  })

  it('7개 초과 waypoints는 구간 분할 후 병합', async () => {
    mockFetch.mockResolvedValue(new Response(successBody, { status: 200 }))
    const manyPoints = Array.from({ length: 9 }, (_, i) => wp(37.5 + i * 0.01, 127.0))
    await getGlobalRoadDirections(manyPoints)
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })
})
