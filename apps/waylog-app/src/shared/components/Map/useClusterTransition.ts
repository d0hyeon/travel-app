import { useEffect, useMemo, useRef, useState } from 'react'
import type { Cluster } from '@waylog/domains/modules/map'
import {
  findAbsorbedClusters,
  findEmergedClusters,
  type AbsorbedCluster,
} from './useClusterTransition.utils'

const EXIT_DURATION = 300

export interface TransitioningCluster {
  cluster: Cluster
  destination: Cluster['center']
  isLeaving: boolean
  /** 갈라져 나온 클러스터가 처음 그려질 자리. 부모가 있던 곳에서 출발해 퍼져 보인다. */
  origin?: Cluster['center']
}

export function useClusterTransition(clusters: Cluster[] | null): TransitioningCluster[] {
  const [leaving, setLeaving] = useState<AbsorbedCluster[]>([])
  const previousRef = useRef<Cluster[]>([])
  const timersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>())

  // 출발점은 클러스터가 처음 그려지는 그 렌더에 있어야 한다. effect 로 미루면
  // 이미 목적지에 마운트된 뒤라 움직일 구간이 없다.
  const { absorbed, origins } = useMemo(() => {
    const next = clusters ?? []
    const previous = previousRef.current
    previousRef.current = next

    return {
      absorbed: findAbsorbedClusters(previous, next),
      origins: new Map(
        findEmergedClusters(previous, next).map((entry) => [entry.cluster.id, entry.origin]),
      ),
    }
  }, [clusters])

  useEffect(() => {
    const next = clusters ?? []

    const revivedIds = new Set(next.map((cluster) => cluster.id))
    for (const [id, timer] of timersRef.current) {
      if (!revivedIds.has(id)) continue
      clearTimeout(timer)
      timersRef.current.delete(id)
    }

    setLeaving((current) => [
      ...current.filter((entry) => !revivedIds.has(entry.cluster.id)),
      ...absorbed.filter((entry) => !timersRef.current.has(entry.cluster.id)),
    ])

    for (const entry of absorbed) {
      const id = entry.cluster.id
      if (timersRef.current.has(id)) continue

      timersRef.current.set(
        id,
        setTimeout(() => {
          timersRef.current.delete(id)
          setLeaving((current) => current.filter((leavingEntry) => leavingEntry.cluster.id !== id))
        }, EXIT_DURATION),
      )
    }
  }, [clusters, absorbed])

  useEffect(() => {
    const timers = timersRef.current
    return () => {
      for (const timer of timers.values()) clearTimeout(timer)
      timers.clear()
    }
  }, [])

  return [
    ...(clusters ?? []).map((cluster) => ({
      cluster,
      destination: cluster.center,
      isLeaving: false,
      origin: origins.get(cluster.id),
    })),
    ...leaving.map((entry) => ({
      cluster: entry.cluster,
      destination: entry.destination,
      isLeaving: true,
    })),
  ]
}
