import { Box, type BoxProps } from '@mui/material';
import { use, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { GoogleMapContext } from '../MapContext';
import type { Coordinate, MapBounds, MapProps } from '../types';
import { loadGoogleMaps } from './loader';

interface MarkerData {
  id: string;
  position: Coordinate;
  label?: string;
  tooltip?: string | string[];
  variant?: 'default' | 'selected' | 'disabled';
  color?: string;
  opacity?: number;
  thumbnailUrl?: string;
  onClick?: () => void;
  onContextMenu?: () => void;
}


const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 };

const PASTEL_MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#f5f0eb' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#7b6f6a' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#f5f0eb' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9e8f0' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#7aa8b5' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#e8ddd5' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#f7e6c8' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#e8c89a' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#b07c4a' }] },
  { featureType: 'road.arterial', elementType: 'labels.text.fill', stylers: [{ color: '#a09080' }] },
  { featureType: 'road.local', elementType: 'labels.text.fill', stylers: [{ color: '#b0a090' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#e8f0d8' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#7a9060' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#d4e8c0' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#6a9050' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#e8d8f0' }] },
  { featureType: 'transit.station', elementType: 'labels.text.fill', stylers: [{ color: '#8070a0' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#d0c0b0' }] },
  { featureType: 'administrative.land_parcel', elementType: 'labels.text.fill', stylers: [{ color: '#a09080' }] },
  { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#ede8e0' }] },
];

type Props = MapProps & Omit<BoxProps, 'ref' | 'autoFocus'>

export function preload() {
  loadGoogleMaps();
}
export default function GoogleMap({
  defaultCenter = DEFAULT_CENTER,
  ref,
  autoFocus = 'marker',
  clustering = false,
  clusterGridSize = 60,
  showMyLocation = false,
  onBoundsChange,
  children,
  ...boxProps
}: Props) {
  use(loadGoogleMaps());

  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [zoom, setZoom] = useState(10);
  const [clusterZoom, setClusterZoom] = useState(10);
  const boundsRef = useRef<google.maps.LatLngBounds | null>(null);
  const isInitializedRef = useRef(false);
  const onBoundsChangeRef = useRef(onBoundsChange);
  onBoundsChangeRef.current = onBoundsChange;

  useEffect(() => {
    const id = setTimeout(() => setClusterZoom(zoom), 200);
    return () => clearTimeout(id);
  }, [zoom]);

  useEffect(() => {
    if (!container) return;
    const mapInstance = new google.maps.Map(container, {
      center: { lat: defaultCenter.lat, lng: defaultCenter.lng },
      zoom: 10,
      disableDefaultUI: true,
      styles: PASTEL_MAP_STYLES,
    });

    const zoomListener = mapInstance.addListener('zoom_changed', () => {
      setZoom(mapInstance.getZoom() ?? 10);
    });

    const idleListener = mapInstance.addListener('idle', () => {
      const bounds = mapInstance.getBounds();
      if (!bounds) return;
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      onBoundsChangeRef.current?.({
        north: ne.lat(),
        south: sw.lat(),
        east: ne.lng(),
        west: sw.lng(),
      } satisfies MapBounds);
    });

    setMap(mapInstance);

    return () => {
      google.maps.event.removeListener(zoomListener);
      google.maps.event.removeListener(idleListener);
    };
  }, [container]);

  const extendBound = useCallback((coord: Coordinate) => {
    if (!map) return;
    if (!boundsRef.current) {
      boundsRef.current = new google.maps.LatLngBounds();
    }
    boundsRef.current.extend({ lat: coord.lat, lng: coord.lng });

    if (!isInitializedRef.current) {
      requestAnimationFrame(() => {
        if (isInitializedRef.current) return;
        isInitializedRef.current = true;
        if (boundsRef.current) map.fitBounds(boundsRef.current);
      });
    }
  }, [map]);

  const markerRegistryRef = useRef<Map<string, MarkerData>>(new Map());
  const [markerVersion, setMarkerVersion] = useState(0);

  const registerMarker = useCallback((data: MarkerData) => {
    markerRegistryRef.current.set(data.id, data);
    setMarkerVersion(v => v + 1);
  }, []);

  const unregisterMarker = useCallback((id: string) => {
    markerRegistryRef.current.delete(id);
    setMarkerVersion(v => v + 1);
  }, []);

  const clusters = useMemo(() => {
    if (!clustering || !map) return null;
    const markers = Array.from(markerRegistryRef.current.values());
    return calculateClusters(markers, map, clusterZoom, clusterGridSize);
  }, [clustering, map, clusterGridSize, markerVersion, clusterZoom]);

  useImperativeHandle(ref, () => ({
    panTo: (lat: number, lng: number, z?: number) => {
      if (!map) return;
      map.panTo({ lat, lng });
      if (z != null) map.setZoom(z);
    },
    relayout: () => {
      if (!map) return;
      google.maps.event.trigger(map, 'resize');
    },
    focus: () => {
      if (!map || !boundsRef.current) return;
      map.fitBounds(boundsRef.current);
    },
  }), [map]);

  const contextValue = useMemo(() => ({
    map,
    extendBound,
    registerMarker,
    unregisterMarker,
    config: { autoFocus, clustering, clusterGridSize },
  }), [map, extendBound, registerMarker, unregisterMarker, autoFocus, clustering, clusterGridSize]);

  const handleClusterClick = useCallback((cluster: Cluster) => {
    if (!map) return;
    const bounds = new google.maps.LatLngBounds();
    cluster.markers.forEach(m => bounds.extend({ lat: m.position.lat, lng: m.position.lng }));
    map.fitBounds(bounds);
  }, [map]);

  return (
    <GoogleMapContext.Provider value={contextValue}>
      <Box ref={setContainer} position="relative" {...boxProps} />
      {children}
      {clusters && map && (
        <ClusterOverlays map={map} clusters={clusters} onClusterClick={handleClusterClick} />
      )}
      {showMyLocation && map && <GoogleMyLocationOverlay map={map} />}
    </GoogleMapContext.Provider>
  );
}

function GoogleMyLocationOverlay({ map }: { map: google.maps.Map }) {
  useEffect(() => {
    if (!navigator.geolocation) return;

    let overlay: google.maps.OverlayView | null = null;
    let watchId: number;

    const createOverlay = (lat: number, lng: number) => {
      if (overlay) overlay.setMap(null);

      class MyLocationOverlayView extends google.maps.OverlayView {
        private el: HTMLDivElement;
        private position: google.maps.LatLng;

        constructor(position: google.maps.LatLng) {
          super();
          this.position = position;
          this.el = document.createElement('div');
          this.el.style.cssText = `
            width: 16px; height: 16px; border-radius: 50%;
            background: #4285f4; border: 3px solid #fff;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            position: absolute; transform: translate(-50%, -50%);
          `;
        }

        onAdd() { this.getPanes()!.overlayMouseTarget.appendChild(this.el); }
        draw() {
          const proj = this.getProjection();
          const point = proj.fromLatLngToDivPixel(this.position);
          if (point) {
            this.el.style.left = `${point.x}px`;
            this.el.style.top = `${point.y}px`;
          }
        }
        onRemove() { this.el.parentNode?.removeChild(this.el); }
      }

      overlay = new MyLocationOverlayView(new google.maps.LatLng(lat, lng));
      overlay.setMap(map);
    };

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        createOverlay(pos.coords.latitude, pos.coords.longitude);
        watchId = navigator.geolocation.watchPosition(
          (pos) => createOverlay(pos.coords.latitude, pos.coords.longitude),
          undefined,
          { enableHighAccuracy: true }
        );
      },
      () => { /* 위치 권한 거부 시 무시 */ },
      { enableHighAccuracy: true }
    );

    return () => {
      overlay?.setMap(null);
      if (watchId != null) navigator.geolocation.clearWatch(watchId);
    };
  }, [map]);

  return null;
}


// ============ Helpers ============

function createThumbnailContent(thumbnailUrl: string, color: string): string {
  return `
    <div style="display:flex; flex-direction:column; align-items:center; filter:drop-shadow(0 3px 8px rgba(0,0,0,0.25));">
      <div style="width:48px; height:48px; border-radius:50%; border:3px solid ${color}; overflow:hidden; background:#eee;">
        <img src="${thumbnailUrl}" style="width:100%;height:100%;object-fit:cover;" />
      </div>
      <div style="width:0; height:0; border-left:5px solid transparent; border-right:5px solid transparent; border-top:6px solid ${color}; margin-top:-1px;"></div>
    </div>
  `;
}

// ============ Clustering ============

interface Cluster {
  id: string;
  center: Coordinate;
  markers: MarkerData[];
}

function latLngToPixel(lat: number, lng: number, zoom: number): { x: number; y: number } {
  const scale = Math.pow(2, zoom);
  const x = (lng + 180) / 360 * scale * 256;
  const sinLat = Math.sin(lat * Math.PI / 180);
  const y = (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale * 256;
  return { x, y };
}

function calculateClusters(markers: MarkerData[], _map: google.maps.Map, zoom: number, gridSize: number): Cluster[] {
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
      const dx = pixel.x - op.x, dy = pixel.y - op.y;
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

interface ClusterOverlaysProps {
  map: google.maps.Map;
  clusters: Cluster[];
  onClusterClick: (cluster: Cluster) => void;
}

function ClusterOverlays({ map, clusters, onClusterClick }: ClusterOverlaysProps) {
  const overlaysRef = useRef<google.maps.OverlayView[]>([]);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const elRegistryRef = useRef<Array<{ el: HTMLElement; type: string; handler: EventListener }>>([]);

  useEffect(() => {
    elRegistryRef.current.forEach(({ el, type, handler }) => el.removeEventListener(type, handler));
    elRegistryRef.current = [];
    overlaysRef.current.forEach(o => o.setMap(null));
    overlaysRef.current = [];
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    clusters.forEach(cluster => {
      if (cluster.markers.length === 1) {
        const md = cluster.markers[0];

        if (md.thumbnailUrl) {
          const el = document.createElement('div');
          el.innerHTML = createThumbnailContent(md.thumbnailUrl, md.color ?? '#ef5350');
          el.style.cssText = 'position:absolute; transform:translate(-50%, -100%); cursor:pointer;';
          if (md.onContextMenu) {
            el.addEventListener('contextmenu', md.onContextMenu);
            elRegistryRef.current.push({ el, type: 'contextmenu', handler: md.onContextMenu });
          }
          if (md.onClick) {
            el.addEventListener('click', md.onClick);
            elRegistryRef.current.push({ el, type: 'click', handler: md.onClick });
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
          overlaysRef.current.push(overlay);
        } else {
          const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 24 36"><path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24c0-6.6-5.4-12-12-12z" fill="${md.color ?? '#ef5350'}" fill-opacity="${md.opacity ?? 1}"/><circle cx="12" cy="11" r="4" fill="white"/></svg>`;
          const tooltipText = Array.isArray(md.tooltip) ? md.tooltip.join('\n') : md.tooltip;
          const marker = new google.maps.Marker({
            position: { lat: md.position.lat, lng: md.position.lng },
            map,
            title: tooltipText,
            icon: { url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`, scaledSize: new google.maps.Size(28, 40), anchor: new google.maps.Point(14, 40) },
            opacity: md.opacity ?? 1,
          });
          if (md.onClick) marker.addListener('click', md.onClick);
          if (md.onContextMenu) marker.addListener('rightclick', md.onContextMenu);
          markersRef.current.push(marker);

          if (md.label) {
            class LOverlay extends google.maps.OverlayView {
              private div: HTMLDivElement | null = null;
              onAdd() {
                this.div = document.createElement('div');
                this.div.style.cssText = `position:absolute; background:${md.color ?? '#ef5350'}; color:white; padding:2px 6px; border-radius:10px; font-size:11px; font-weight:bold; white-space:nowrap; pointer-events:none; transform:translate(-50%,-100%); margin-top:-44px;`;
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
            overlaysRef.current.push(lo);
          }
        }
      } else {
        const el = document.createElement('div');
        el.innerHTML = `<div style="width:38px;height:38px;background:white;border:2px solid #bdbdbd;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#555;font-size:13px;font-weight:600;box-shadow:0 2px 8px rgba(0,0,0,0.15);cursor:pointer;">${cluster.markers.length}</div>`;
        el.style.cssText = 'position:absolute; transform:translate(-50%,-50%);';
        const clusterClickHandler: EventListener = () => onClusterClick(cluster);
        el.addEventListener('click', clusterClickHandler);
        elRegistryRef.current.push({ el, type: 'click', handler: clusterClickHandler });

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
        overlaysRef.current.push(overlay);
      }
    });

    return () => {
      elRegistryRef.current.forEach(({ el, type, handler }) => el.removeEventListener(type, handler));
      elRegistryRef.current = [];
      overlaysRef.current.forEach(o => o.setMap(null));
      overlaysRef.current = [];
      markersRef.current.forEach(m => m.setMap(null));
      markersRef.current = [];
    };
  }, [map, clusters, onClusterClick]);

  return null;
}
