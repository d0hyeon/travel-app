import { useEffect, useEffectEvent, useMemo, useRef } from 'react';
import { isInMapBounds } from '../../map.utils';
import { KakaoMapContext, useMapContext } from '../../MapContext';
import { useMapViewport } from '../useMapViewport';
import { useMapZoomLevel } from '../useMapZoomLevel';
import { buildEntry, createClusters, destroyEntry, type ClusterEntry } from './cluster.utils';
import { useRegisteredMarker } from '../../useClusterRegistry';


interface Props {
  gridSize: number;
}

export function KakaoMapClusterOverlays({ gridSize }: Props) {
  const { map } = useMapContext(KakaoMapContext);
  const { data: registry, version } = useRegisteredMarker();
  const zoom = useMapZoomLevel();
  const bounds = useMapViewport();

  const clusters = useMemo(() => {
    const allMarkers = Array.from(registry.values());
    const visibleMarkers = bounds
      ? allMarkers.filter(m => isInMapBounds(m.position.lat, m.position.lng, bounds))
      : allMarkers;

    return createClusters(visibleMarkers, map, gridSize);
  }, [registry, version, bounds, gridSize]);

  const entriesRef = useRef<Map<string, ClusterEntry>>(new Map());

  const handleClick = useEffectEvent((markers: { position: { lat: number; lng: number } }[]) => {
    const bounds = new kakao.maps.LatLngBounds();
    markers.forEach(m => bounds.extend(new kakao.maps.LatLng(m.position.lat, m.position.lng)));
    map.setBounds(bounds);
  });
  useEffect(() => {
    const newClusterMap = new Map(clusters.map(c => [c.id, c]));

    for (const [id, entry] of entriesRef.current) {
      if (!newClusterMap.has(id)) {
        destroyEntry(entry);
        entriesRef.current.delete(id);
      }
    }

    for (const [id, cluster] of newClusterMap) {
      if (entriesRef.current.has(id)) continue;
      entriesRef.current.set(
        id,
        buildEntry(cluster, map, zoom, () => handleClick(cluster.markers))
      );
    }
  }, [clusters]);

  useEffect(() => {
    return () => {
      for (const entry of entriesRef.current.values()) destroyEntry(entry);
      entriesRef.current.clear();
    };
  }, []);

  return null;
}

