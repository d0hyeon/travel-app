import { describe, expect, it } from 'vitest'
import { findAbsorbedClusters, findEmergedClusters } from '../useClusterTransition.utils'
import type { Cluster } from '@waylog/domains/modules/map'

function cluster(id: string, markerIds: string[], lat: number, lng: number): Cluster {
  return {
    id,
    center: { lat, lng },
    markers: markerIds.map((markerId) => ({ id: markerId, position: { lat, lng } })),
  }
}

describe('findAbsorbedClusters', () => {
  it('사라진 클러스터는 마커를 가장 많이 물려받은 클러스터로 흡수된다', () => {
    const previous = [cluster('cluster_a', ['a', 'b'], 0, 0), cluster('cluster_y', ['y', 'z'], 10, 10)]
    const next = [cluster('cluster_a', ['a', 'b', 'y', 'z'], 5, 5)]

    const absorbed = findAbsorbedClusters(previous, next)

    expect(absorbed).toHaveLength(1)
    expect(absorbed[0]!.cluster.id).toBe('cluster_y')
    expect(absorbed[0]!.destination).toEqual({ lat: 5, lng: 5 })
  })

  it('그대로 남아 있는 클러스터는 흡수 대상이 아니다', () => {
    const previous = [cluster('cluster_a', ['a', 'b'], 0, 0)]
    const next = [cluster('cluster_a', ['a', 'b'], 1, 1)]

    expect(findAbsorbedClusters(previous, next)).toEqual([])
  })

  it('물려받은 곳이 없으면 제자리에서 사라진다', () => {
    const previous = [cluster('cluster_y', ['y', 'z'], 10, 10)]
    const next = [cluster('cluster_a', ['a', 'b'], 0, 0)]

    const absorbed = findAbsorbedClusters(previous, next)

    expect(absorbed[0]!.destination).toEqual({ lat: 10, lng: 10 })
  })

  it('하나가 여러 곳으로 흩어지면 가장 많이 가져간 곳으로 향한다', () => {
    const previous = [cluster('cluster_a', ['a', 'b', 'c', 'd'], 0, 0)]
    const next = [
      cluster('cluster_b', ['b'], 1, 1),
      cluster('cluster_c', ['a', 'c', 'd'], 9, 9),
    ]

    const absorbed = findAbsorbedClusters(previous, next)

    expect(absorbed).toHaveLength(1)
    expect(absorbed[0]!.destination).toEqual({ lat: 9, lng: 9 })
  })
})

describe('findEmergedClusters', () => {
  it('기존 클러스터에서 갈라져 나온 클러스터는 원래 자리에서 출발한다', () => {
    const previous = [cluster('cluster_a', ['a', 'b', 'c', 'd'], 0, 0)]
    const next = [
      cluster('cluster_a', ['a', 'b'], 1, 1),
      cluster('cluster_c', ['c', 'd'], 9, 9),
    ]

    const emerged = findEmergedClusters(previous, next)

    expect(emerged).toHaveLength(1)
    expect(emerged[0]!.cluster.id).toBe('cluster_c')
    expect(emerged[0]!.origin).toEqual({ lat: 0, lng: 0 })
  })

  it('이전에 없던 마커로만 이루어진 클러스터는 출발점이 없다', () => {
    const previous = [cluster('cluster_a', ['a', 'b'], 0, 0)]
    const next = [cluster('cluster_a', ['a', 'b'], 0, 0), cluster('cluster_y', ['y', 'z'], 9, 9)]

    expect(findEmergedClusters(previous, next)).toEqual([])
  })

  it('그대로 유지된 클러스터는 등장 대상이 아니다', () => {
    const previous = [cluster('cluster_a', ['a', 'b'], 0, 0)]
    const next = [cluster('cluster_a', ['a', 'b'], 1, 1)]

    expect(findEmergedClusters(previous, next)).toEqual([])
  })
})

describe('싱글턴 전이', () => {
  it('클러스터에서 떨어져 나온 단일 마커도 원래 자리에서 출발한다', () => {
    const previous = [cluster('cluster_a', ['a', 'b', 'c'], 0, 0)]
    const next = [cluster('cluster_a', ['a', 'b'], 1, 1), cluster('single_c', ['c'], 9, 9)]

    const emerged = findEmergedClusters(previous, next)

    expect(emerged.map((entry) => entry.cluster.id)).toContain('single_c')
    expect(emerged.find((entry) => entry.cluster.id === 'single_c')!.origin).toEqual({ lat: 0, lng: 0 })
  })

  it('단일 마커가 클러스터로 흡수되면 그 클러스터로 빨려들어간다', () => {
    const previous = [cluster('cluster_a', ['a', 'b'], 0, 0), cluster('single_c', ['c'], 9, 9)]
    const next = [cluster('cluster_a', ['a', 'b', 'c'], 3, 3)]

    const absorbed = findAbsorbedClusters(previous, next)

    expect(absorbed.map((entry) => entry.cluster.id)).toContain('single_c')
    expect(absorbed.find((entry) => entry.cluster.id === 'single_c')!.destination).toEqual({ lat: 3, lng: 3 })
  })
})
