import { describe, expect, it } from 'vitest'
import { clusterMarkers, type ToPixel } from '../cluster.core'
import type { Coordinate, MarkerData } from '../types'

// 위경도를 그대로 픽셀로 쓴다. 거리 계산만 검증하면 되므로 투영은 항등이다.
const toPixel: ToPixel = (coord: Coordinate) => ({ x: coord.lng, y: coord.lat })

function marker(id: string, lat: number, lng: number): MarkerData {
  return { id, position: { lat, lng } }
}

describe('clusterMarkers', () => {
  it('격자 크기 안의 좌표들을 하나의 클러스터로 묶는다', () => {
    const clusters = clusterMarkers([marker('a', 0, 0), marker('b', 3, 4)], toPixel, 10)

    expect(clusters).toHaveLength(1)
    expect(clusters[0]!.markers.map((m) => m.id)).toEqual(['a', 'b'])
  })

  it('격자 경계를 넘는 좌표는 다른 클러스터가 된다', () => {
    const clusters = clusterMarkers([marker('a', 0, 0), marker('b', 3, 4)], toPixel, 4)

    expect(clusters).toHaveLength(2)
  })

  it('클러스터 중심을 소속 좌표의 평균으로 계산한다', () => {
    const clusters = clusterMarkers([marker('a', 0, 0), marker('b', 2, 6)], toPixel, 10)

    expect(clusters[0]!.center).toEqual({ lat: 1, lng: 3 })
  })

  it('좌표가 하나면 클러스터가 아니라 단일 마커로 남는다', () => {
    const clusters = clusterMarkers([marker('a', 0, 0)], toPixel, 10)

    expect(clusters).toHaveLength(1)
    expect(clusters[0]!.id).toBe('single_a')
  })

  it('마커가 없으면 빈 배열이다', () => {
    expect(clusterMarkers([], toPixel, 10)).toEqual([])
  })
})

describe('클러스터 식별자', () => {
  it('구성이 바뀌어도 대표 마커가 남아 있으면 같은 식별자를 유지한다', () => {
    const before = clusterMarkers([marker('a', 0, 0), marker('b', 1, 1)], toPixel, 10)
    const after = clusterMarkers([marker('a', 0, 0), marker('b', 1, 1), marker('c', 2, 2)], toPixel, 10)

    expect(before[0]!.id).toBe(after[0]!.id)
  })

  it('한 프레임 안에서 식별자가 겹치지 않는다', () => {
    const clusters = clusterMarkers(
      [marker('a', 0, 0), marker('b', 1, 1), marker('y', 100, 100), marker('z', 101, 101)],
      toPixel,
      10,
    )
    const ids = clusters.map((cluster) => cluster.id)

    expect(new Set(ids).size).toBe(ids.length)
  })

  it('서로 다른 마커로 이루어진 클러스터는 다른 식별자를 가진다', () => {
    const clusters = clusterMarkers(
      [marker('a', 0, 0), marker('b', 1, 1), marker('y', 100, 100), marker('z', 101, 101)],
      toPixel,
      10,
    )

    expect(clusters[0]!.id).not.toBe(clusters[1]!.id)
  })
})
