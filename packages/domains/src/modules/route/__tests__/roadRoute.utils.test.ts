import { describe, expect, it } from 'vitest'
import { splitIntoSegments } from '../roadRoute.utils'

const wp = (lat: number) => ({ lat, lng: 127.0 })
const points = (count: number) => Array.from({ length: count }, (_, i) => wp(37.5 + i * 0.01))

describe('splitIntoSegments', () => {
  it('경계가 없으면 기존 maxSize 분할과 같다', () => {
    const waypoints = points(9)

    expect(splitIntoSegments(waypoints, 7)).toEqual(splitIntoSegments(waypoints, 7, []))
  })

  it('경계에서 조각을 나누고 끝점을 공유하지 않는다', () => {
    const [숙소, 인천공항, 오사카공항, 오사카성] = points(4)

    const segments = splitIntoSegments([숙소, 인천공항, 오사카공항, 오사카성], 7, [1])

    expect(segments).toEqual([
      [숙소, 인천공항],
      [오사카공항, 오사카성]
    ])
  })

  it('경계로 나뉜 조각이 maxSize를 넘으면 다시 분할한다', () => {
    const waypoints = points(12)

    const segments = splitIntoSegments(waypoints, 4, [5])

    expect(segments.every((x) => x.length <= 4)).toBe(true)
    expect(segments.flat().length).toBeGreaterThan(waypoints.length - 1)
  })

  it('연속된 경계는 가운데 조각을 만들지 않는다', () => {
    const [a, b, c, d] = points(4)

    const segments = splitIntoSegments([a, b, c, d], 7, [1, 2])

    expect(segments).toEqual([[a, b]])
  })
})
