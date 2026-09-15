import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getRoadDirections } from '../roadRoute.api'

vi.mock('../../../gateways/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}))

import { supabase } from '../../../gateways/client'

const mockInvoke = vi.mocked(supabase.functions.invoke)

const wp = (lat: number, lng: number) => ({ lat, lng })

const twoPoints = [wp(37.5, 127.0), wp(37.6, 127.1)]
const successData = {
  coordinates: [wp(37.5, 127.0), wp(37.55, 127.05), wp(37.6, 127.1)],
  legs: [{ duration: 720, distance: 4200, coordinates: [wp(37.5, 127.0), wp(37.55, 127.05), wp(37.6, 127.1)] }],
}

beforeEach(() => mockInvoke.mockReset())

describe('getRoadDirections', () => {
  it('waypoints가 1개면 그대로 반환', async () => {
    const result = await getRoadDirections([wp(37.5, 127.0)], 'korea')
    expect(result).toEqual({ coordinates: [wp(37.5, 127.0)], legs: [] })
    expect(mockInvoke).not.toHaveBeenCalled()
  })

  it('성공 시 coordinates와 legs 반환', async () => {
    mockInvoke.mockResolvedValue({ data: successData, error: null })
    const result = await getRoadDirections(twoPoints, 'korea')
    expect(result).toEqual(successData)
  })

  it('region=korea로 요청', async () => {
    mockInvoke.mockResolvedValue({ data: successData, error: null })
    await getRoadDirections(twoPoints, 'korea')
    expect(mockInvoke).toHaveBeenCalledWith('road-directions', {
      body: { waypoints: twoPoints, region: 'korea' },
    })
  })

  it('region=global로 요청', async () => {
    mockInvoke.mockResolvedValue({ data: successData, error: null })
    await getRoadDirections(twoPoints, 'global')
    expect(mockInvoke).toHaveBeenCalledWith('road-directions', {
      body: { waypoints: twoPoints, region: 'global' },
    })
  })

  it('API 오류 시 원본 waypoints를 leg 없이 반환', async () => {
    mockInvoke.mockResolvedValue({ data: null, error: new Error('fail') })
    const result = await getRoadDirections(twoPoints, 'korea')
    expect(result).toEqual({
      coordinates: twoPoints,
      legs: [{ duration: 0, distance: 0, transport: 'car', coordinates: [twoPoints[0], twoPoints[1]] }],
    })
  })

  it('교통 구간 경계에서 경로를 잇지 않는다', async () => {
    const 숙소 = wp(37.5, 127.0)
    const 인천공항 = wp(37.46, 126.44)
    const 오사카공항 = wp(34.43, 135.23)
    const 오사카성 = wp(34.68, 135.52)

    mockInvoke
      .mockResolvedValueOnce({ data: { coordinates: [숙소, 인천공항], legs: [] }, error: null })
      .mockResolvedValueOnce({ data: { coordinates: [오사카공항, 오사카성], legs: [] }, error: null })

    const result = await getRoadDirections([숙소, 인천공항, 오사카공항, 오사카성], 'global', [1])

    // 경계 양쪽 조각을 따로 요청한다
    expect(mockInvoke).toHaveBeenCalledTimes(2)
    expect(mockInvoke).toHaveBeenNthCalledWith(1, 'road-directions', {
      body: { waypoints: [숙소, 인천공항], region: 'global' },
    })
    expect(mockInvoke).toHaveBeenNthCalledWith(2, 'road-directions', {
      body: { waypoints: [오사카공항, 오사카성], region: 'global' },
    })
    // 오사카공항이 병합에서 사라지지 않는다
    expect(result.coordinates).toEqual([숙소, 인천공항, 오사카공항, 오사카성])
  })

  it('7개 초과 waypoints는 구간 분할 후 병합', async () => {
    mockInvoke.mockResolvedValue({ data: successData, error: null })
    const manyPoints = Array.from({ length: 9 }, (_, i) => wp(37.5 + i * 0.01, 127.0))
    await getRoadDirections(manyPoints, 'global')
    expect(mockInvoke).toHaveBeenCalledTimes(2)
  })
})
