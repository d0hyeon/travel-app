
// ── 내부 타입 ──────────────────────────────────────────

import { clusterMarkers, type Cluster } from "../../cluster.core";
import type { MarkerData } from "../../types";
import {  getZoomScale, renderMarker } from "../marker.renderers";

export type { Cluster };

// ── 렌더링 ─────────────────────────────────────────────
interface RenderClusterProps {
  cluster: Cluster;
  map: kakao.maps.Map;
  zoom: number;
  onClick: (cluster: Cluster) => void;
}
export function renderCluster({ cluster, map, zoom, onClick }: RenderClusterProps) {
  if (cluster.markers.length === 1) return renderMarker(cluster.markers[0], map, zoom);
  return renderClusterGroupEntry(cluster, map, zoom, onClick);
}

function renderClusterGroupEntry(cluster: Cluster, map: kakao.maps.Map, zoom: number, onClick: (cluster: Cluster) => void) {
   
  const handler = () => onClick?.(cluster);
  const content = document.createElement('div');
  content.innerHTML = createClusterContent(cluster.markers.length, zoom);
  content.style.cursor = 'pointer';
  content.addEventListener('click', handler);


  const overlay = new kakao.maps.CustomOverlay({
    position: new kakao.maps.LatLng(cluster.center.lat, cluster.center.lng),
    content,
    yAnchor: 0.5,
    xAnchor: 0.5,
  });
  overlay.setMap(map);

  return () => {
    overlay.setMap(null);
    content.removeEventListener('click', handler)
  }
  
}


function createClusterContent(count: number, level: number): string {
  const scale = getZoomScale(level);
  const size = Math.round(40 * scale);
  const fontSize = Math.round(14 * scale);
  return `
    <div style="
      width: ${size}px;
      height: ${size}px;
      background: #1976d2;
      border: 3px solid white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: ${fontSize}px;
      font-weight: bold;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    ">${count}</div>
  `;
}

export function createClusters(markers: MarkerData[], map: kakao.maps.Map, gridSize: number): Cluster[] {
  const projection = map.getProjection();
  return clusterMarkers(
    markers,
    coord => projection.pointFromCoords(new kakao.maps.LatLng(coord.lat, coord.lng)),
    gridSize,
  );
}
