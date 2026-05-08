import { createThumbnailContent } from '../GoogleMap.utils';
import type { Coordinate, MarkerData } from '../../types';

export interface ClusterEntry {
  overlays: google.maps.OverlayView[];
  markers: google.maps.Marker[];
  domHandlers: Array<{ el: HTMLElement; type: string; handler: EventListener }>;
}

export interface Cluster {
  id: string;
  center: Coordinate;
  markers: MarkerData[];
}

export function destroyEntry(entry: ClusterEntry) {
  entry.domHandlers.forEach(({ el, type, handler }) => el.removeEventListener(type, handler));
  entry.overlays.forEach(o => o.setMap(null));
  entry.markers.forEach(m => m.setMap(null));
}

export function buildEntry(cluster: Cluster, map: google.maps.Map, onClusterClick: () => void): ClusterEntry {
  if (cluster.markers.length === 1) return buildSingleMarkerEntry(cluster.markers[0], map);
  return buildClusterGroupEntry(cluster, map, onClusterClick);
}

function buildSingleMarkerEntry(md: MarkerData, map: google.maps.Map): ClusterEntry {
  const entry: ClusterEntry = { overlays: [], markers: [], domHandlers: [] };

  if (md.thumbnailUrl) {
    const el = document.createElement('div');
    el.innerHTML = createThumbnailContent(md.thumbnailUrl, md.color ?? '#ef5350');
    el.style.cssText = 'position:absolute; transform:translate(-50%, -100%); cursor:pointer;';
    if (md.onClick) {
      el.addEventListener('click', md.onClick);
      entry.domHandlers.push({ el, type: 'click', handler: md.onClick });
    }
    if (md.onContextMenu) {
      el.addEventListener('contextmenu', md.onContextMenu);
      entry.domHandlers.push({ el, type: 'contextmenu', handler: md.onContextMenu });
    }
    class TOverlay extends google.maps.OverlayView {
      onAdd() { this.getPanes()?.overlayMouseTarget.appendChild(el); }
      draw() {
        const pos = this.getProjection().fromLatLngToDivPixel(new google.maps.LatLng(md.position.lat, md.position.lng));
        if (pos) { el.style.left = `${pos.x}px`; el.style.top = `${pos.y - 8}px`; }
      }
      onRemove() { el.parentNode?.removeChild(el); }
    }
    const overlay = new TOverlay();
    overlay.setMap(map);
    entry.overlays.push(overlay);
    return entry;
  }

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
  if (md.onClick) marker.addListener('click', md.onClick);
  if (md.onContextMenu) marker.addListener('rightclick', md.onContextMenu);
  entry.markers.push(marker);

  if (md.label) {
    class LOverlay extends google.maps.OverlayView {
      private div: HTMLDivElement | null = null;
      onAdd() {
        this.div = document.createElement('div');
        this.div.style.cssText = `position:absolute; background:${markerColor}; color:white; padding:2px 6px; border-radius:10px; font-size:11px; font-weight:bold; white-space:nowrap; pointer-events:none; transform:translate(-50%,-100%); margin-top:-${isCircle ? 24 : 44}px;`;
        this.div.textContent = md.label!;
        this.getPanes()?.overlayLayer.appendChild(this.div);
      }
      draw() {
        if (!this.div) return;
        const pos = this.getProjection().fromLatLngToDivPixel(new google.maps.LatLng(md.position.lat, md.position.lng));
        if (pos) { this.div.style.left = `${pos.x}px`; this.div.style.top = `${pos.y}px`; }
      }
      onRemove() { if (this.div?.parentNode) { this.div.parentNode.removeChild(this.div); this.div = null; } }
    }
    const lo = new LOverlay();
    lo.setMap(map);
    entry.overlays.push(lo);
  }

  return entry;
}

function buildClusterGroupEntry(cluster: Cluster, map: google.maps.Map, onClusterClick: () => void): ClusterEntry {
  const entry: ClusterEntry = { overlays: [], markers: [], domHandlers: [] };

  const el = document.createElement('div');
  el.innerHTML = `<div style="width:38px;height:38px;background:white;border:2px solid #bdbdbd;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#555;font-size:13px;font-weight:600;box-shadow:0 2px 8px rgba(0,0,0,0.15);cursor:pointer;">${cluster.markers.length}</div>`;
  el.style.cssText = 'position:absolute; transform:translate(-50%,-50%);';
  el.addEventListener('click', onClusterClick);
  entry.domHandlers.push({ el, type: 'click', handler: onClusterClick });

  class COverlay extends google.maps.OverlayView {
    onAdd() { this.getPanes()?.overlayMouseTarget.appendChild(el); }
    draw() {
      const pos = this.getProjection().fromLatLngToDivPixel(new google.maps.LatLng(cluster.center.lat, cluster.center.lng));
      if (pos) { el.style.left = `${pos.x}px`; el.style.top = `${pos.y}px`; }
    }
    onRemove() { el.parentNode?.removeChild(el); }
  }
  const overlay = new COverlay();
  overlay.setMap(map);
  entry.overlays.push(overlay);

  return entry;
}

function latLngToPixel(lat: number, lng: number, zoom: number): { x: number; y: number } {
  const scale = Math.pow(2, zoom);
  const x = (lng + 180) / 360 * scale * 256;
  const sinLat = Math.sin(lat * Math.PI / 180);
  const y = (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale * 256;
  return { x, y };
}

export function createClusters(markers: MarkerData[], zoom: number, gridSize: number): Cluster[] {
  if (markers.length === 0) return [];

  const markerPixels = markers.map(m => ({
    marker: m,
    pixel: latLngToPixel(m.position.lat, m.position.lng, zoom),
  }));

  const processed = new Set<string>();
  const clusters: Cluster[] = [];

  markerPixels.forEach(({ marker, pixel }) => {
    if (processed.has(marker.id)) return;

    const nearby: MarkerData[] = [marker];
    processed.add(marker.id);

    markerPixels.forEach(({ marker: other, pixel: op }) => {
      if (processed.has(other.id)) return;
      const dx = pixel.x - op.x;
      const dy = pixel.y - op.y;
      if (Math.sqrt(dx * dx + dy * dy) <= gridSize) {
        nearby.push(other);
        processed.add(other.id);
      }
    });

    if (nearby.length >= 2) {
      const centerLat = nearby.reduce((s, m) => s + m.position.lat, 0) / nearby.length;
      const centerLng = nearby.reduce((s, m) => s + m.position.lng, 0) / nearby.length;
      clusters.push({ id: `cluster_${marker.id}`, center: { lat: centerLat, lng: centerLng }, markers: nearby });
    } else {
      clusters.push({ id: `single_${marker.id}`, center: marker.position, markers: [marker] });
    }
  });

  return clusters;
}
