import { useCallback, useMemo } from 'react';
import { isInMapBounds } from '../../map.utils';
import { KakaoMapContext, useMapContext } from '../../MapContext';
import { useReconcileClusterEntries } from '../../useReconcileClusterEntries';
import { useRegisteredMarker } from '../../useClusterRegistry';
import { useMapViewport } from '../useMapViewport';
import { useMapZoomLevel } from '../useMapZoomLevel';
import { createClusters, renderCluster, type Cluster } from './cluster.utils';


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

  const handleClick = useCallback((cluster: Cluster) => {
    const bounds = new kakao.maps.LatLngBounds();
    cluster.markers.forEach(m => bounds.extend(new kakao.maps.LatLng(m.position.lat, m.position.lng)));
    map.setBounds(bounds);
  }, [map]);

  useReconcileClusterEntries(
    clusters,
    cluster => renderCluster({ cluster, map, zoom, onClick: handleClick })
  );

  return null;
}

