import { useEffect, useEffectEvent, useMemo, useRef } from 'react';
import { isInMapBounds } from '../../map.utils';
import { GoogleMapContext, useMapContext } from '../../MapContext';
import { useMapViewport } from '../useMapViewport';
import { buildEntry, createClusters, destroyEntry, type ClusterEntry } from './cluster.utils';
import { useRegisteredMarker } from '../../useClusterRegistry';
import { useMapZoomLevel } from '../useMapZoomLevel';

interface Props {
  gridSize: number;
}

export function GoogleMapClusterOverlays({ gridSize }: Props) {
  const { map } = useMapContext(GoogleMapContext);
  const { data: registry, version } = useRegisteredMarker();

  const zoom = useMapZoomLevel();
  const bounds = useMapViewport();
  const handleClick = useEffectEvent((markers: { position: { lat: number; lng: number } }[]) => {
    const bounds = new google.maps.LatLngBounds();
    markers.forEach(m => bounds.extend({ lat: m.position.lat, lng: m.position.lng }));
    map.fitBounds(bounds);
  });

  const clusters = useMemo(() => {
    const allMarkers = Array.from(registry.values());
    const visibleMarkers = bounds
      ? allMarkers.filter(m => isInMapBounds(m.position.lat, m.position.lng, bounds))
      : allMarkers;
    return createClusters(visibleMarkers, zoom, gridSize);
  }, [registry, version, bounds, zoom, gridSize]);

  const entriesRef = useRef<Map<string, ClusterEntry>>(new Map());

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
      entriesRef.current.set(id, buildEntry(cluster, map, () => handleClick(cluster.markers)));
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
