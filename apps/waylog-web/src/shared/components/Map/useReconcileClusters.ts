import { useEffect, useEffectEvent, useRef } from 'react';
import { type Cluster } from './cluster.core';

type CleanupFunction = VoidFunction;
/**
 * 클러스터 목록을 id 기준으로 동기화한다. 사라진 클러스터는 cleanup으로 정리하고
 * 새 클러스터만 renderCluster로 그리며, 언마운트 시 전체를 정리한다.
 */
export function useReconcileClusters(clusters: Cluster[], renderCluster: (cluster: Cluster) => CleanupFunction) {
  const entriesRef = useRef<Map<string, CleanupFunction>>(new Map());
  const renderEntry = useEffectEvent(renderCluster);

  useEffect(() => {
    const nextClusters = new Map(clusters.map(cluster => [cluster.id, cluster]));

    for (const [id, cleanup] of entriesRef.current) {
      if (nextClusters.has(id)) continue;
      cleanup();
      entriesRef.current.delete(id);
    }

    for (const [id, cluster] of nextClusters) {
      if (entriesRef.current.has(id)) continue;
      entriesRef.current.set(id, renderEntry(cluster));
    }
  }, [clusters]);

  useEffect(() => {
    const entries = entriesRef.current;
    return () => {
      for (const cleanup of entries.values()) cleanup();
      entries.clear();
    };
  }, []);
}
