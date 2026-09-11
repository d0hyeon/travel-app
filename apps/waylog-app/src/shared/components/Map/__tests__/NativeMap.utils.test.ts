import { describe, expect, it } from 'vitest'
import { DEFAULT_DELTA, MIN_FIT_SPAN, deltaToZoom, levelToDelta, toFitBounds } from '../NativeMap.utils'

describe('levelToDelta', () => {
  it('레벨 3에서 기본 delta를 반환한다', () => {
    expect(levelToDelta(3)).toBe(DEFAULT_DELTA)
  })

  it('레벨이 1 증가할 때마다 delta가 2배가 된다', () => {
    expect(levelToDelta(4)).toBeCloseTo(DEFAULT_DELTA * 2)
  })
})

describe('deltaToZoom', () => {
  it('delta 360일 때 줌 레벨 0을 반환한다', () => {
    expect(deltaToZoom(360)).toBe(0)
  })

  it('delta가 절반이 되면 줌 레벨이 1 증가한다', () => {
    expect(deltaToZoom(180)).toBe(1)
  })
})

describe('toFitBounds', () => {
  it('좌표가 없으면 null 을 반환한다', () => {
    expect(toFitBounds([])).toBeNull()
  })

  it('떨어진 좌표들은 실제 범위를 그대로 감싼다', () => {
    const bounds = toFitBounds([
      { lat: 37.0, lng: 127.0 },
      { lat: 38.0, lng: 128.0 },
    ])

    expect(bounds).toEqual({ ne: [128.0, 38.0], sw: [127.0, 37.0] })
  })

  it('좌표가 하나면 최소 범위만큼 넓혀 최대 배율로 당겨지지 않게 한다', () => {
    const bounds = toFitBounds([{ lat: 37.5, lng: 127.0 }])

    expect(bounds).not.toBeNull()
    const [neLng, neLat] = bounds!.ne
    const [swLng, swLat] = bounds!.sw
    expect(neLat - swLat).toBeCloseTo(MIN_FIT_SPAN)
    expect(neLng - swLng).toBeCloseTo(MIN_FIT_SPAN)
  })

  it('좌표가 최소 범위보다 밀집해 있으면 최소 범위까지 넓힌다', () => {
    const bounds = toFitBounds([
      { lat: 37.5, lng: 127.0 },
      { lat: 37.5001, lng: 127.0001 },
    ])

    expect(bounds).not.toBeNull()
    expect(bounds!.ne[1] - bounds!.sw[1]).toBeCloseTo(MIN_FIT_SPAN)
  })

  it('넓히는 범위는 원래 중심을 유지한다', () => {
    const bounds = toFitBounds([{ lat: 37.5, lng: 127.0 }])

    expect(bounds).not.toBeNull()
    expect((bounds!.ne[1] + bounds!.sw[1]) / 2).toBeCloseTo(37.5)
    expect((bounds!.ne[0] + bounds!.sw[0]) / 2).toBeCloseTo(127.0)
  })

  it('위도와 경도를 각각 판단한다', () => {
    // 경도로는 충분히 넓지만 위도로는 0인 회랑 모양.
    const bounds = toFitBounds([
      { lat: 37.5, lng: 127.0 },
      { lat: 37.5, lng: 128.0 },
    ])

    expect(bounds).not.toBeNull()
    expect(bounds!.ne[0] - bounds!.sw[0]).toBeCloseTo(1.0)
    expect(bounds!.ne[1] - bounds!.sw[1]).toBeCloseTo(MIN_FIT_SPAN)
  })
})
