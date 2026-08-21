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
