import { describe, expect, it } from 'vitest'
import {
  DEFAULT_DELTA,
  MIN_FIT_SPAN,
  deltaToZoom,
  levelToDelta,
  toFitBounds,
  toViewportBounds,
} from '../NativeMap.utils'

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

  it('좌표들의 실제 범위를 그대로 감싼다', () => {
    const bounds = toFitBounds([
      { lat: 37.0, lng: 127.0 },
      { lat: 38.0, lng: 128.0 },
    ])

    expect(bounds).toEqual({ ne: [128.0, 38.0], sw: [127.0, 37.0] })
  })

  it('밀집한 좌표를 최소 범위로 넓히지 않는다', () => {
    const bounds = toFitBounds([
      { lat: 37.5, lng: 127.0 },
      { lat: 37.5001, lng: 127.0001 },
    ])

    expect(bounds).not.toBeNull()
    expect(bounds!.ne[1] - bounds!.sw[1]).toBeCloseTo(0.0001)
    expect(bounds!.ne[0] - bounds!.sw[0]).toBeCloseTo(0.0001)
  })

  it('좌표가 하나면 넓이가 없는 범위를 반환한다', () => {
    expect(toFitBounds([{ lat: 37.5, lng: 127.0 }])).toEqual({
      ne: [127.0, 37.5],
      sw: [127.0, 37.5],
    })
  })
})

describe('toViewportBounds', () => {
  it('좌표가 없으면 null 을 반환한다', () => {
    expect(toViewportBounds([])).toBeNull()
  })

  it('떨어진 좌표들은 실제 범위를 그대로 감싼다', () => {
    expect(
      toViewportBounds([
        { lat: 37.0, lng: 127.0 },
        { lat: 38.0, lng: 128.0 },
      ]),
    ).toEqual({ ne: [128.0, 38.0], sw: [127.0, 37.0] })
  })

  it('좌표가 하나면 최소 범위만큼 넓혀 최대 배율로 당겨지지 않게 한다', () => {
    const bounds = toViewportBounds([{ lat: 37.5, lng: 127.0 }])

    expect(bounds).not.toBeNull()
    expect(bounds!.ne[1] - bounds!.sw[1]).toBeCloseTo(MIN_FIT_SPAN)
    expect(bounds!.ne[0] - bounds!.sw[0]).toBeCloseTo(MIN_FIT_SPAN)
  })

  it('넓히는 범위는 원래 중심을 유지한다', () => {
    const bounds = toViewportBounds([{ lat: 37.5, lng: 127.0 }])

    expect(bounds).not.toBeNull()
    expect((bounds!.ne[1] + bounds!.sw[1]) / 2).toBeCloseTo(37.5)
    expect((bounds!.ne[0] + bounds!.sw[0]) / 2).toBeCloseTo(127.0)
  })

  it('위도와 경도를 각각 판단한다', () => {
    const bounds = toViewportBounds([
      { lat: 37.5, lng: 127.0 },
      { lat: 37.5, lng: 128.0 },
    ])

    expect(bounds).not.toBeNull()
    expect(bounds!.ne[0] - bounds!.sw[0]).toBeCloseTo(1.0)
    expect(bounds!.ne[1] - bounds!.sw[1]).toBeCloseTo(MIN_FIT_SPAN)
  })
})
