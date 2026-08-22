import { describe, expect, it } from 'vitest'
import { splitIntoSegments } from '../roadRoute.utils'

function points(count: number) {
  return Array.from({ length: count }, (_, i) => ({ lat: i, lng: i }))
}

describe('splitIntoSegments', () => {
  it('경유지를 최대 크기 단위로 나눈다', () => {
    const segments = splitIntoSegments(points(10), 4)

    // 구간이 끝점을 공유하므로 겹치며 나뉜다: [0..3][3..6][6..9]
    expect(segments.map((s) => s.length)).toEqual([4, 4, 4])
  })

  it('나뉜 구간이 끝점을 공유하도록 이어붙인다', () => {
    const segments = splitIntoSegments(points(7), 4)

    expect(segments[0]!.at(-1)).toEqual(segments[1]![0])
  })

  it('경유지가 최대 크기 이하면 구간이 하나다', () => {
    expect(splitIntoSegments(points(4), 7)).toHaveLength(1)
  })

  it('경유지가 둘이면 구간이 하나다', () => {
    expect(splitIntoSegments(points(2), 7)).toEqual([points(2)])
  })
})
