
// ── 내부 타입 ──────────────────────────────────────────

import type { MarkerData } from "../../types";
import { createClusterContent, createLabelContent, createThumbnailMarkerNode, getMarkerImage, getZoomScale } from "../kakaoMap.utils";

export interface ClusterEntry {
  overlays: kakao.maps.CustomOverlay[];
  markers: kakao.maps.Marker[];
  cleanups: Array<() => void>;
}

// ── 렌더링 ─────────────────────────────────────────────

export function buildEntry(cluster: Cluster, map: kakao.maps.Map, zoom: number, onClusterClick: () => void): ClusterEntry {
  if (cluster.markers.length === 1) return buildSingleMarkerEntry(cluster.markers[0], map, zoom);
  return buildClusterGroupEntry(cluster, map, zoom, onClusterClick);
}

export function buildSingleMarkerEntry(md: MarkerData, map: kakao.maps.Map, zoom: number): ClusterEntry {
  const entry: ClusterEntry = { overlays: [], markers: [], cleanups: [] };

  if (md.thumbnailUrl) {
    const { node, destroy } = createThumbnailMarkerNode({
      thumbnailUrl: md.thumbnailUrl,
      color: md.color,
      onClick: md.onClick,
      onContextMenu: md.onContextMenu,
    });
    entry.cleanups.push(destroy);
    const overlay = new kakao.maps.CustomOverlay({
      position: new kakao.maps.LatLng(md.position.lat, md.position.lng),
      content: node,
      yAnchor: 1.08,
      xAnchor: 0.5,
    });
    overlay.setMap(map);
    entry.overlays.push(overlay);
    return entry;
  }

  const position = new kakao.maps.LatLng(md.position.lat, md.position.lng);
  const marker = new kakao.maps.Marker({
    position,
    image: getMarkerImage(md.variant, md.color, md.opacity, zoom, md.outlined),
  });
  marker.setMap(map);
  entry.markers.push(marker);

  if (md.onClick) {
    const onClick = md.onClick;
    kakao.maps.event.addListener(marker, 'click', onClick);
    entry.cleanups.push(() => kakao.maps.event.removeListener(marker, 'click', onClick));
  }
  if (md.onContextMenu) {
    const onContextMenu = md.onContextMenu;
    kakao.maps.event.addListener(marker, 'rightclick', onContextMenu);
    entry.cleanups.push(() => kakao.maps.event.removeListener(marker, 'rightclick', onContextMenu));
  }

  if (md.label) {
    const scale = getZoomScale(zoom);
    const labelOverlay = new kakao.maps.CustomOverlay({
      position,
      content: createLabelContent(md.label, md.variant, md.color, md.opacity, zoom),
      yAnchor: 1 + (36 * scale + 4) / 20,
    });
    labelOverlay.setMap(map);
    entry.overlays.push(labelOverlay);
  }

  return entry;
}

export function buildClusterGroupEntry(cluster: Cluster, map: kakao.maps.Map, zoom: number, onClusterClick: () => void): ClusterEntry {
  const entry: ClusterEntry = { overlays: [], markers: [], cleanups: [] };

  const content = document.createElement('div');
  content.innerHTML = createClusterContent(cluster.markers.length, zoom);
  content.style.cursor = 'pointer';
  content.addEventListener('click', onClusterClick);
  entry.cleanups.push(() => content.removeEventListener('click', onClusterClick));

  const overlay = new kakao.maps.CustomOverlay({
    position: cluster.center,
    content,
    yAnchor: 0.5,
    xAnchor: 0.5,
  });
  overlay.setMap(map);
  entry.overlays.push(overlay);

  return entry;
}

export function destroyEntry(entry: ClusterEntry) {
  entry.cleanups.forEach(cleanup => cleanup());
  entry.overlays.forEach(o => o.setMap(null));
  entry.markers.forEach(m => m.setMap(null));
}

interface Cluster {
  id: string;
  center: kakao.maps.LatLng;
  markers: MarkerData[];
}

export function createClusters(
  markers: MarkerData[],
  map: kakao.maps.Map,
  gridSize: number,
): Cluster[] {
  if (markers.length === 0) return [];

  const projection = map.getProjection();
  const markerPixels = markers.map(marker => ({
    marker,
    pixel: projection.pointFromCoords(new kakao.maps.LatLng(marker.position.lat, marker.position.lng)),
  }));

  const processed = new Set<string>();
  const clusters: Cluster[] = [];

  markerPixels.forEach(({ marker, pixel }) => {
    if (processed.has(marker.id)) return;

    const nearby: MarkerData[] = [marker];
    processed.add(marker.id);

    markerPixels.forEach(({ marker: other, pixel: otherPixel }) => {
      if (processed.has(other.id)) return;
      const dx = pixel.x - otherPixel.x;
      const dy = pixel.y - otherPixel.y;
      if (Math.sqrt(dx * dx + dy * dy) <= gridSize) {
        nearby.push(other);
        processed.add(other.id);
      }
    });

    if (nearby.length >= 2) {
      const centerLat = nearby.reduce((s, m) => s + m.position.lat, 0) / nearby.length;
      const centerLng = nearby.reduce((s, m) => s + m.position.lng, 0) / nearby.length;
      const stableId = nearby.map(m => m.id).toSorted().join(',');
      clusters.push({
        id: `cluster_${stableId}`,
        center: new kakao.maps.LatLng(centerLat, centerLng),
        markers: nearby,
      });
    } else {
      clusters.push({
        id: `single_${marker.id}`,
        center: new kakao.maps.LatLng(marker.position.lat, marker.position.lng),
        markers: [marker],
      });
    }
  });

  return clusters;
}
