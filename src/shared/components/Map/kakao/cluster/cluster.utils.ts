
// ── 내부 타입 ──────────────────────────────────────────

import { clusterMarkers, type Cluster } from "../../cluster.core";
import type { MarkerData } from "../../types";
import { createClusterContent, createLabelContent, createThumbnailMarkerNode, getMarkerImage, getZoomScale } from "../kakaoMap.utils";

export type { Cluster };

// ── 렌더링 ─────────────────────────────────────────────
interface RenderClusterProps {
  cluster: Cluster;
  map: kakao.maps.Map;
  zoom: number;
  onClick: (cluster: Cluster) => void;
}
export function renderCluster({ cluster, map, zoom, onClick }: RenderClusterProps) {
  if (cluster.markers.length === 1) return renderSingleMarker(cluster.markers[0], map, zoom);
  return renderClusterGroupEntry(cluster, map, zoom, onClick);
}

export function renderSingleMarker(md: MarkerData, map: kakao.maps.Map, zoom: number) {
  if (md.thumbnailUrl) {
    const { node, destroy } = createThumbnailMarkerNode({
      thumbnailUrl: md.thumbnailUrl,
      color: md.color,
      onClick: md.onClick,
      onContextMenu: md.onContextMenu,
    });
    
    const overlay = new kakao.maps.CustomOverlay({
      position: new kakao.maps.LatLng(md.position.lat, md.position.lng),
      content: node,
      yAnchor: 1.08,
      xAnchor: 0.5,
    });
    overlay.setMap(map);

    return () => {
      destroy();
      overlay.setMap(null);
    }
  }

  const cleanups: VoidFunction[] = [];

  const position = new kakao.maps.LatLng(md.position.lat, md.position.lng);
  const marker = new kakao.maps.Marker({
    position,
    image: getMarkerImage(md.variant, md.color, md.opacity, zoom, md.outlined),
  });
  marker.setMap(map);
  cleanups.push(() => marker.setMap(null))


  if (md.onClick) {
    const onClick = md.onClick;
    kakao.maps.event.addListener(marker, 'click', onClick);
    cleanups.push(() => kakao.maps.event.removeListener(marker, 'click', onClick));
  }
  if (md.onContextMenu) {
    const onContextMenu = md.onContextMenu;
    kakao.maps.event.addListener(marker, 'rightclick', onContextMenu);
    cleanups.push(() => kakao.maps.event.removeListener(marker, 'rightclick', onContextMenu));
  }

  if (md.label) {
    const scale = getZoomScale(zoom);
    const labelOverlay = new kakao.maps.CustomOverlay({
      position,
      content: createLabelContent(md.label, md.variant, md.color, md.opacity, zoom),
      yAnchor: 1 + (36 * scale + 4) / 20,
    });
    labelOverlay.setMap(map);
    cleanups.push(() => labelOverlay.setMap(null));
  }

  return () => cleanups.forEach(cleanup => cleanup())
}

export function renderClusterGroupEntry(cluster: Cluster, map: kakao.maps.Map, zoom: number, onClick: (cluster: Cluster) => void) {
   
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


export function createClusters(markers: MarkerData[], map: kakao.maps.Map, gridSize: number): Cluster[] {
  const projection = map.getProjection();
  return clusterMarkers(
    markers,
    coord => projection.pointFromCoords(new kakao.maps.LatLng(coord.lat, coord.lng)),
    gridSize,
  );
}
