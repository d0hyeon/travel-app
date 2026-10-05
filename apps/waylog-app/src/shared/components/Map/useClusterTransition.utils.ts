import type { Cluster, Coordinate } from '@waylog/domains/modules/map'

export interface AbsorbedCluster {
  cluster: Cluster
  destination: Coordinate
}

export interface EmergedCluster {
  cluster: Cluster
  origin: Coordinate
}

/** 이전 클러스터에서 갈라져 나온 클러스터. 원래 있던 자리에서 출발해야 분산으로 보인다. */
export function findEmergedClusters(previous: Cluster[], next: Cluster[]): EmergedCluster[] {
  const previousIds = new Set(previous.map((cluster) => cluster.id))

  return next
    .filter((cluster) => !previousIds.has(cluster.id))
    .map((cluster) => ({ cluster, origin: findParent(cluster, previous)?.center }))
    .filter((entry): entry is EmergedCluster => entry.origin != null)
}

function findParent(emerged: Cluster, previous: Cluster[]): Cluster | undefined {
  const emergedMarkerIds = new Set(emerged.markers.map((marker) => marker.id))

  return previous.reduce<Cluster | undefined>((parent, candidate) => {
    const shared = countInherited(candidate, emergedMarkerIds)
    if (shared === 0) return parent
    if (parent == null) return candidate

    return shared > countInherited(parent, emergedMarkerIds) ? candidate : parent
  }, undefined)
}

export function findAbsorbedClusters(previous: Cluster[], next: Cluster[]): AbsorbedCluster[] {
  const survivingIds = new Set(next.map((cluster) => cluster.id))

  return previous
    .filter((cluster) => !survivingIds.has(cluster.id))
    .map((cluster) => ({
      cluster,
      destination: findHeir(cluster, next)?.center ?? cluster.center,
    }))
}

function findHeir(gone: Cluster, next: Cluster[]): Cluster | undefined {
  const goneMarkerIds = new Set(gone.markers.map((marker) => marker.id))

  return next.reduce<Cluster | undefined>((heir, candidate) => {
    const inherited = countInherited(candidate, goneMarkerIds)
    if (inherited === 0) return heir
    if (heir == null) return candidate

    return inherited > countInherited(heir, goneMarkerIds) ? candidate : heir
  }, undefined)
}

function countInherited(cluster: Cluster, markerIds: Set<string>): number {
  return cluster.markers.filter((marker) => markerIds.has(marker.id)).length
}
