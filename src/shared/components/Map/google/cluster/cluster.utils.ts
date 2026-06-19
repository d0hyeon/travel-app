import { clusterMarkers, type Cluster, type Pixel } from '../../cluster.core';
import type { Coordinate, MarkerData } from '../../types';
import { createLabelNode, createPositionedOverlay, createThumbnailMarkerNode } from '../GoogleMap.utils';

export type { Cluster };
  
interface RenderClusterProps {
  cluster: Cluster;
  map: google.maps.Map,
  onClick: (cluster: Cluster) => void;
}

export function renderCluster({ cluster, map, onClick }: RenderClusterProps) {
  if (cluster.markers.length === 1) return renderSingleMarker(cluster.markers[0], map);
  return renderClusterGroupEntry(cluster, map, onClick);
}

function renderSingleMarker(md: MarkerData, map: google.maps.Map) {

  if (md.thumbnailUrl) {
    const { node, destroy } = createThumbnailMarkerNode({
      thumbnailUrl: md.thumbnailUrl,
      color: md.color ?? '#ef5350',
      onClick: md.onClick,
      onContextMenu: md.onContextMenu,
    });
    const overlay = createPositionedOverlay({ node, position: md.position, pane: 'overlayMouseTarget', offsetY: -8 });
    overlay.setMap(map);
    
    return () => {
      destroy();
      overlay.setMap(null)
    }
  }

  const cleanups: VoidFunction[] = [];

  const markerColor = md.color ?? '#ef5350';
  const markerOpacity = md.opacity ?? 1;
  const isCircle = md.variant === 'circle';
  const svg = isCircle
    ? md.outlined
      ? `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="white" fill-opacity="0.9" stroke="${markerColor}" stroke-width="2.5"/></svg>`
      : `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="${markerColor}" fill-opacity="${markerOpacity}" stroke="white" stroke-width="4.5"/><circle cx="8" cy="8" r="6" fill="none" stroke="${markerColor}" fill-opacity="${markerOpacity}" stroke-width="1"/></svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 24 36"><path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24c0-6.6-5.4-12-12-12z" fill="${markerColor}" fill-opacity="${markerOpacity}"/><circle cx="12" cy="11" r="4" fill="white"/></svg>`;

  const tooltipText = Array.isArray(md.tooltip) ? md.tooltip.join('\n') : md.tooltip;
  const marker = new google.maps.Marker({
    position: { lat: md.position.lat, lng: md.position.lng },
    map,
    title: tooltipText,
    icon: isCircle
      ? { url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`, scaledSize: new google.maps.Size(20, 20), anchor: new google.maps.Point(8, 8) }
      : { url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`, scaledSize: new google.maps.Size(28, 40), anchor: new google.maps.Point(14, 40) },
    opacity: markerOpacity,
  });
  if (md.onClick) {
    const { remove } = marker.addListener('click', md.onClick)
    cleanups.push(remove);
  }
  if (md.onContextMenu) {
    const { remove } = marker.addListener('rightclick', md.onContextMenu);
    cleanups.push(remove);
  }
  
  
  cleanups.push(() => marker.setMap(null));

  if (md.label) {
    const labelNode = createLabelNode(md.label, markerColor, isCircle ? 24 : 44);
    const labelOverlay = createPositionedOverlay({ node: labelNode, position: md.position, pane: 'overlayLayer' });
    labelOverlay.setMap(map);
    cleanups.push(() => labelOverlay.setMap(null));
  }

  return () => cleanups.forEach(cleanup => cleanup())
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
