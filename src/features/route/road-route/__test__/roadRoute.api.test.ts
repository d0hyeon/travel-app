import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getRoadDirections, getGlobalRoadDirections } from '../roadRoute.api'

vi.mock('~api/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}))

import { supabase } from '~api/client'

const mockInvoke = vi.mocked(supabase.functions.invoke)

const wp = (lat: number, lng: number) => ({ lat, lng })

const twoPoints = [wp(37.5, 127.0), wp(37.6, 127.1)]
const successData = {
  coordinates: [wp(37.5, 127.0), wp(37.55, 127.05), wp(37.6, 127.1)],
}

beforeEach(() => mockInvoke.mockReset())

describe('getRoadDirections', () => {
  it('waypoints가 1개면 그대로 반환', async () => {
    const result = await getRoadDirections([wp(37.5, 127.0)])
    expect(result).toEqual([wp(37.5, 127.0)])
    expect(mockInvoke).not.toHaveBeenCalled()
  })

  it('성공 시 coordinates 반환', async () => {
    mockInvoke.mockResolvedValue({ data: successData, error: null })
    const result = await getRoadDirections(twoPoints)
    expect(result).toEqual(successData.coordinates)
  })

  it('region=korea로 요청', async () => {
    mockInvoke.mockResolvedValue({ data: successData, error: null })
    await getRoadDirections(twoPoints)
    expect(mockInvoke).toHaveBeenCalledWith('road-directions', {
      body: { waypoints: twoPoints, region: 'korea' },
    })
  })

  it('API 오류 시 원본 waypoints 반환', async () => {
    mockInvoke.mockResolvedValue({ data: null, error: new Error('fail') })
    const result = await getRoadDirections(twoPoints)
    expect(result).toEqual(twoPoints)
  })

})

describe('getGlobalRoadDirections', () => {
  it('region=global로 요청', async () => {
    mockInvoke.mockResolvedValue({ data: successData, error: null })
    await getGlobalRoadDirections(twoPoints)
    expect(mockInvoke).toHaveBeenCalledWith('road-directions', {
      body: { waypoints: twoPoints, region: 'global' },
    })
  })

  it('7개 초과 waypoints는 구간 분할 후 병합', async () => {
    mockInvoke.mockResolvedValue({ data: successData, error: null })
    const manyPoints = Array.from({ length: 9 }, (_, i) => wp(37.5 + i * 0.01, 127.0))
    await getGlobalRoadDirections(manyPoints)
    expect(mockInvoke).toHaveBeenCalledTimes(2)
  })
})
