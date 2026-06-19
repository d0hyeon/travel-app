import { useCallback, useMemo } from 'react';
import { isInMapBounds } from '../../map.utils';
import { GoogleMapContext, useMapContext } from '../../MapContext';
import { useMapViewport } from '../useMapViewport';
import { renderCluster, createClusters, type Cluster } from './cluster.utils';
import { useReconcileClusterEntries } from '../../useReconcileClusterEntries';
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
  const handleClick = useCallback((cluster: Cluster) => {
    const bounds = new google.maps.LatLngBounds();
    cluster.markers.forEach(m => bounds.extend({ lat: m.position.lat, lng: m.position.lng }));
    map.fitBounds(bounds);
  }, [map]);

  const clusters = useMemo(() => {
    const allMarkers = Array.from(registry.values());
    const allClusters = createClusters(allMarkers, zoom, gridSize);
    if (!bounds) return allClusters;
    return allClusters.filter(c => isInMapBounds(c.center.lat, c.center.lng, bounds));
  }, [registry, version, zoom, gridSize, bounds]);


  useReconcileClusterEntries(
    clusters,
    cluster => renderCluster({ cluster, map, onClick: handleClick })
  );

  return null;
}
