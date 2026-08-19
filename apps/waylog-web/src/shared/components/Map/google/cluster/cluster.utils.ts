import { clusterMarkers, type Cluster, type Pixel } from '../../cluster.core';
import type { Coordinate, MarkerData } from '../../types';
import { createPositionedOverlay, renderMarker } from '../marker.renderers';

export type { Cluster };

interface RenderClusterProps {
  cluster: Cluster;
  map: google.maps.Map,
  onClick: (cluster: Cluster) => void;
}

export function renderCluster({ cluster, map, onClick }: RenderClusterProps) {
  if (cluster.markers.length === 1) return renderMarker(cluster.markers[0], map);
  return renderClusterGroupEntry(cluster, map, onClick);
}

function renderClusterGroupEntry(cluster: Cluster, map: google.maps.Map, onClusterClick: (clsuter: Cluster) => void) {
  const cleanups: VoidFunction[] = []

  const el = document.createElement('div');
  el.innerHTML = `<div style="width:38px;height:38px;background:white;border:2px solid #bdbdbd;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#555;font-size:13px;font-weight:600;box-shadow:0 2px 8px rgba(0,0,0,0.15);cursor:pointer;">${cluster.markers.length}</div>`;
  el.style.cssText = 'position:absolute; transform:translate(-50%,-50%);';

  const clickHandler: EventListener = (e) => {
    e.stopPropagation();
    onClusterClick(cluster);
  };
  el.addEventListener('click', clickHandler);
  cleanups.push(() => el.removeEventListener('click', clickHandler));

  const overlay = createPositionedOverlay({ node: el, position: cluster.center, pane: 'overlayMouseTarget' });
  overlay.setMap(map);
  cleanups.push(() => overlay.setMap(null));

  return () => cleanups.forEach(cleanup => cleanup())
}

function latLngToPixel({ lat, lng }: Coordinate, zoom: number): Pixel {
  const scale = Math.pow(2, zoom);
  const x = (lng + 180) / 360 * scale * 256;
  const sinLat = Math.sin(lat * Math.PI / 180);
  const y = (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale * 256;
  return { x, y };
}

export function createClusters(markers: MarkerData[], zoom: number, gridSize: number): Cluster[] {
  return clusterMarkers(markers, coord => latLngToPixel(coord, zoom), gridSize);
}
