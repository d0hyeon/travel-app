import { describe, expect, it } from 'vitest'
import { createZoomToPixel } from '../cluster.core'
import type { Coordinate } from '../types'

describe('createZoomToPixel', () => {
  it('경도 -180 은 x 원점이고 180 은 한 바퀴 끝이다', () => {
    const toPixel = createZoomToPixel(0)

    expect(toPixel({ lat: 0, lng: -180 }).x).toBeCloseTo(0)
    expect(toPixel({ lat: 0, lng: 180 }).x).toBeCloseTo(256)
  })

  it('적도는 세로 한 바퀴의 중앙이다', () => {
    expect(createZoomToPixel(0)({ lat: 0, lng: 0 }).y).toBeCloseTo(128)
  })

  it('북반구는 적도보다 위(작은 y)에 놓인다', () => {
    const toPixel = createZoomToPixel(0)

    expect(toPixel({ lat: 45, lng: 0 }).y).toBeLessThan(toPixel({ lat: 0, lng: 0 }).y)
  })

  it('zoom 이 1 오르면 같은 좌표의 픽셀 거리가 두 배가 된다', () => {
    const near = createZoomToPixel(10)
    const far = createZoomToPixel(11)
    const distance = (toPixel: ReturnType<typeof createZoomToPixel>) =>
      toPixel({ lat: 0, lng: 1 }).x - toPixel({ lat: 0, lng: 0 }).x

    expect(distance(far)).toBeCloseTo(distance(near) * 2)
  })

  it('원점이 고정되어 있어 이동해도 두 좌표의 픽셀 거리가 보존된다', () => {
    const toPixel = createZoomToPixel(14)
    const distance = (a: Coordinate, b: Coordinate) => {
      const [pa, pb] = [toPixel(a), toPixel(b)]
      return Math.hypot(pa.x - pb.x, pa.y - pb.y)
    }
    const shift = ({ lat, lng }: Coordinate) => ({ lat, lng: lng + 0.5 })

    const seoul = { lat: 37.5665, lng: 126.978 }
    const incheon = { lat: 37.4563, lng: 126.7052 }

    expect(distance(shift(seoul), shift(incheon))).toBeCloseTo(distance(seoul, incheon))
  })

  it('소수 zoom 도 정수 zoom 사이의 배율로 반영한다', () => {
    const width = (zoom: number) =>
      createZoomToPixel(zoom)({ lat: 0, lng: 1 }).x - createZoomToPixel(zoom)({ lat: 0, lng: 0 }).x

    expect(width(13.5)).toBeGreaterThan(width(13))
    expect(width(13.5)).toBeLessThan(width(14))
  })
})
