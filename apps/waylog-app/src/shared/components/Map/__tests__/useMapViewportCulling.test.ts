import { describe, expect, it } from 'vitest'
import { isCoordinateInBounds } from '../useMapViewportCulling'

describe('isCoordinateInBounds', () => {
  const bounds = { north: 38, south: 37, east: 127, west: 126 }

  it('bounds 내부 좌표는 true를 반환한다', () => {
    expect(isCoordinateInBounds({ lat: 37.5, lng: 126.5 }, bounds)).toBe(true)
  })

  it('bounds 외부 좌표는 false를 반환한다', () => {
    expect(isCoordinateInBounds({ lat: 40, lng: 126.5 }, bounds)).toBe(false)
  })

  it('padding을 주면 경계 바로 밖 좌표도 포함한다', () => {
    expect(isCoordinateInBounds({ lat: 38.05, lng: 126.5 }, bounds, 0.1)).toBe(true)
  })

  it('padding 없이는 경계 바로 밖 좌표를 제외한다', () => {
    expect(isCoordinateInBounds({ lat: 38.05, lng: 126.5 }, bounds)).toBe(false)
  })
})
