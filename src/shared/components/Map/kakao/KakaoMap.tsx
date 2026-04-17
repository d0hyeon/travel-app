import { Box, type BoxProps } from '@mui/material';
import { use, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { useVariation } from '~shared/hooks/extends/useVariation';
import { KakaoMapContext } from '../MapContext';
import type { Coordinate, MapBounds, MapProps, MarkerData } from '../types';
import { isInMapBounds } from '../map.utils';
import { createLabelContent, getMarkerImage, getZoomScale } from './kakaoMap.utils';
import './loader';
import { loadKakaoMap } from './loader';



const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 }

type Props = MapProps & Omit<BoxProps, 'ref' | 'autoFocus'>

export default function KakaoMap({
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
  use(loadKakaoMap());

  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [map, setMap] = useState<kakao.maps.Map | null>(null);
  const [zoom, setZoom] = useState(8);
  const [clusterZoom, setClusterZoom] = useState(8);
  const currentBoundsRef = useRef<MapBounds | null>(null);
  const [clusterBoundsVersion, setClusterBoundsVersion] = useState(0);
  const onBoundsChangeRef = useRef(onBoundsChange);
  onBoundsChangeRef.current = onBoundsChange;

  useEffect(() => {
    const id = setTimeout(() => setClusterZoom(zoom), 200);
    return () => clearTimeout(id);
  }, [zoom]);

  useEffect(() => {
    if (!container) return;

    const mapInstance = new kakao.maps.Map(container, {
      center: new kakao.maps.LatLng(defaultCenter.lat, defaultCenter.lng),
      level: 8,
    });
    setMap(mapInstance);

    const zoomHandler = () => setZoom(mapInstance.getLevel());
    kakao.maps.event.addListener(mapInstance, 'zoom_changed', zoomHandler);

    const idleHandler = () => {
      const bounds = (mapInstance as any).getBounds() as {
        getNorthEast(): kakao.maps.LatLng;
        getSouthWest(): kakao.maps.LatLng;
      } | null;
      if (!bounds) return;
      const newBounds: MapBounds = {
        north: bounds.getNorthEast().getLat(),
        south: bounds.getSouthWest().getLat(),
        east: bounds.getNorthEast().getLng(),
        west: bounds.getSouthWest().getLng(),
      };
      currentBoundsRef.current = newBounds;
      setClusterBoundsVersion(v => v + 1);
      onBoundsChangeRef.current?.(newBounds);
    };
    kakao.maps.event.addListener(mapInstance, 'idle', idleHandler);

    return () => {
      kakao.maps.event.removeListener(mapInstance, 'zoom_changed', zoomHandler);
      kakao.maps.event.removeListener(mapInstance, 'idle', idleHandler);
    };
  }, [container])

  const boundStatusRef = useRef<'closed' | 'open'>('closed')
  const boundsRef = useRef<kakao.maps.LatLngBounds>(new kakao.maps.LatLngBounds());
  const scheduledIdRef = useRef<number | null>(null)

  const [getIsInitialized, setIsInitialized] = useVariation(false);
  const extendBound = useCallback((value: Coordinate) => {
    if (map == null) return;
    if (boundStatusRef.current === 'closed') {
      boundsRef.current = new kakao.maps.LatLngBounds();
      boundStatusRef.current = 'open';
    }

    boundsRef.current.extend(new kakao.maps.LatLng(value.lat, value.lng));
    if (scheduledIdRef.current) cancelAnimationFrame(scheduledIdRef.current);
    scheduledIdRef.current = requestAnimationFrame(() => {
      if (getIsInitialized()) return;
      scheduledIdRef.current = null;
      boundStatusRef.current = 'closed';
      map?.setBounds(boundsRef.current);
      setIsInitialized(true);
    });
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

    const allMarkers = Array.from(markerRegistryRef.current.values());
    const bounds = currentBoundsRef.current;
    const markers = bounds
      ? allMarkers.filter(m => isInMapBounds(m.position.lat, m.position.lng, bounds))
      : allMarkers;
    return calculateClusters(markers, map, clusterGridSize);
  }, [clustering, map, clusterGridSize, markerVersion, clusterZoom, clusterBoundsVersion]);

  useImperativeHandle(ref, () => ({
    panTo: (lat: number, lng: number, level?: number) => {
      if (!map) return;
      if (level != null) map.setLevel(level)
      map.panTo(new kakao.maps.LatLng(lat, lng))
    },
    relayout: () => {
      if (!map) return
      map.relayout()
    },
    focus: () => {
      if (map == null) return;
      const level = map?.getLevel()
      map?.panTo(boundsRef.current);
      map.setLevel(level);
    }
  }), [map]);

  const value = useMemo(() => {
    return {
      map,
      extendBound,
      registerMarker,
      unregisterMarker,
      config: { autoFocus, clustering, clusterGridSize }
    }
  }, [map, autoFocus, clustering, clusterGridSize])

  const handleClusterClick = useCallback((cluster: Cluster) => {
    if (!map) return;
    const bounds = new kakao.maps.LatLngBounds();
    cluster.markers.forEach(m => {
      const position = new kakao.maps.LatLng(m.position.lat, m.position.lng)
      bounds.extend(position);
    });
    map.setBounds(bounds);
  }, [map]);

  return (
    <KakaoMapContext.Provider value={value}>
      <Box ref={setContainer} position="relative" {...boxProps} />
      {children}
      {clusters && map && (
        <ClusterOverlays
          map={map}
          clusters={clusters}
          zoom={zoom}
          onClusterClick={handleClusterClick}
        />
      )}
      {showMyLocation && map && <MyLocationOverlay map={map} />}
    </KakaoMapContext.Provider>
  )
}

function createMyLocationContent() {
  const el = document.createElement('div');
  el.style.cssText = `
    width: 16px; height: 16px; border-radius: 50%;
    background: #4285f4; border: 3px solid #fff;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    transform: translate(-50%, -50%);
  `;
  return el;
}

function MyLocationOverlay({ map }: { map: kakao.maps.Map }) {
  useEffect(() => {
    if (!navigator.geolocation) return;

    let overlay: kakao.maps.CustomOverlay | null = null;
    let watchId: number;

    const updatePosition = (pos: GeolocationPosition) => {
      const latLng = new kakao.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
      if (overlay) overlay.setMap(null);
      overlay = new kakao.maps.CustomOverlay({
        position: latLng,
        content: createMyLocationContent(),
      });
      overlay.setMap(map);
    };

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        updatePosition(pos);
        watchId = navigator.geolocation.watchPosition(updatePosition, undefined, { enableHighAccuracy: true });
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





// ============ Helper functions ============

function createThumbnailContent(thumbnailUrl: string, color?: string): string {
  const borderColor = color ?? '#ef5350';
  return `
    <div style="
      display: flex;
      flex-direction: column;
      align-items: center;
      filter: drop-shadow(0 3px 8px rgba(0,0,0,0.25));
    ">
      <div style="
        width: 48px;
        height: 48px;
        border-radius: 50%;
        border: 3px solid ${borderColor};
        overflow: hidden;
        background: #eee;
      ">
        <img src="${thumbnailUrl}" style="width:100%;height:100%;object-fit:cover;" />
      </div>
      <div style="
        width: 0; height: 0;
        border-left: 5px solid transparent;
        border-right: 5px solid transparent;
        border-top: 6px solid ${borderColor};
        margin-top: -1px;
      "></div>
    </div>
  `
}



// ============ Clustering ============

interface Cluster {
  id: string;
  center: kakao.maps.LatLng;
  markers: MarkerData[];
}

function calculateClusters(
  markers: MarkerData[],
  map: kakao.maps.Map,
  gridSize: number
): Cluster[] {
  if (markers.length === 0) return [];

  const projection = (map as any).getProjection() as {
    pointFromCoords: (latlng: kakao.maps.LatLng) => { x: number; y: number };
  };
  const clusters: Cluster[] = [];
  const processed = new Set<string>();

  const markerPixels = markers.map(marker => ({
    marker,
    pixel: projection.pointFromCoords(new kakao.maps.LatLng(marker.position.lat, marker.position.lng)),
  }));

  markerPixels.forEach(({ marker, pixel }) => {
    if (processed.has(marker.id)) return;

    const nearbyMarkers: MarkerData[] = [marker];
    processed.add(marker.id);

    markerPixels.forEach(({ marker: other, pixel: otherPixel }) => {
      if (processed.has(other.id)) return;

      const dx = pixel.x - otherPixel.x;
      const dy = pixel.y - otherPixel.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= gridSize) {
        nearbyMarkers.push(other);
        processed.add(other.id);
      }
    });

    if (nearbyMarkers.length >= 2) {
      let totalLat = 0;
      let totalLng = 0;
      nearbyMarkers.forEach(m => {
        totalLat += m.position.lat;
        totalLng += m.position.lng;
      });
      const centerLat = totalLat / nearbyMarkers.length;
      const centerLng = totalLng / nearbyMarkers.length;

      clusters.push({
        id: `cluster_${marker.id}`,
        center: new kakao.maps.LatLng(centerLat, centerLng),
        markers: nearbyMarkers,
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

// ============ Diff-based ClusterOverlays ============

interface ClusterEntry {
  overlays: kakao.maps.CustomOverlay[];
  markers: kakao.maps.Marker[];
  domHandlers: Array<{ el: HTMLElement; type: string; handler: EventListener }>;
}

function destroyClusterEntry(entry: ClusterEntry) {
  entry.domHandlers.forEach(({ el, type, handler }) => el.removeEventListener(type, handler));
  entry.overlays.forEach(o => o.setMap(null));
  entry.markers.forEach(m => {
    kakao.maps.event.removeListener(m, 'click', () => {});
    kakao.maps.event.removeListener(m, 'rightclick', () => {});
    m.setMap(null);
  });
}

function buildClusterEntry(
  cluster: Cluster,
  map: kakao.maps.Map,
  zoom: number,
  onClusterClick: () => void,
): ClusterEntry {
  const entry: ClusterEntry = { overlays: [], markers: [], domHandlers: [] };

  if (cluster.markers.length === 1) {
    const md = cluster.markers[0];

    if (md.thumbnailUrl) {
      const el = document.createElement('div');
      el.innerHTML = createThumbnailContent(md.thumbnailUrl, md.color);
      el.style.cursor = 'pointer';
      if (md.onClick) {
        el.addEventListener('click', md.onClick);
        entry.domHandlers.push({ el, type: 'click', handler: md.onClick });
      }
      if (md.onContextMenu) {
        el.addEventListener('contextmenu', md.onContextMenu);
        entry.domHandlers.push({ el, type: 'contextmenu', handler: md.onContextMenu });
      }
      const overlay = new kakao.maps.CustomOverlay({
        position: new kakao.maps.LatLng(md.position.lat, md.position.lng),
        content: el,
        yAnchor: 1.08,
        xAnchor: 0.5,
      });
      overlay.setMap(map);
      entry.overlays.push(overlay);
    } else {
      const marker = new kakao.maps.Marker({
        position: new kakao.maps.LatLng(md.position.lat, md.position.lng),
        image: getMarkerImage(md.variant, md.color, md.opacity, zoom),
      });
      marker.setMap(map);
      entry.markers.push(marker);

      if (md.onClick) kakao.maps.event.addListener(marker, 'click', md.onClick);
      if (md.onContextMenu) kakao.maps.event.addListener(marker, 'rightclick', md.onContextMenu);

      if (md.label) {
        const scale = getZoomScale(zoom);
        const labelOverlay = new kakao.maps.CustomOverlay({
          position: new kakao.maps.LatLng(md.position.lat, md.position.lng),
          content: createLabelContent(md.label, md.variant, md.color, md.opacity, zoom),
          yAnchor: 1 + (36 * scale + 4) / 20,
        });
        labelOverlay.setMap(map);
        entry.overlays.push(labelOverlay);
      }
    }
  } else {
    const content = document.createElement('div');
    content.innerHTML = createClusterContent(cluster.markers.length, zoom);
    content.style.cursor = 'pointer';
    content.addEventListener('click', onClusterClick);
    entry.domHandlers.push({ el: content, type: 'click', handler: onClusterClick });

    const overlay = new kakao.maps.CustomOverlay({
      position: cluster.center,
      content,
      yAnchor: 0.5,
      xAnchor: 0.5,
    });
    overlay.setMap(map);
    entry.overlays.push(overlay);
  }

  return entry;
}

interface ClusterOverlaysProps {
  map: kakao.maps.Map;
  clusters: Cluster[];
  zoom: number;
  onClusterClick: (cluster: Cluster) => void;
}

function ClusterOverlays({ map, clusters, zoom, onClusterClick }: ClusterOverlaysProps) {
  const entriesRef = useRef<Map<string, ClusterEntry>>(new Map());
  const prevZoomRef = useRef<number>(zoom);
  const onClusterClickRef = useRef(onClusterClick);
  onClusterClickRef.current = onClusterClick;

  useEffect(() => {
    const zoomChanged = prevZoomRef.current !== zoom;
    prevZoomRef.current = zoom;

    // zoom 변경 시 마커 크기가 달라지므로 전체 재생성
    if (zoomChanged) {
      for (const entry of entriesRef.current.values()) destroyClusterEntry(entry);
      entriesRef.current.clear();
    }

    // 사라진 클러스터 제거
    const newClusterMap = new Map(clusters.map(c => [c.id, c]));
    for (const [id, entry] of entriesRef.current) {
      if (!newClusterMap.has(id)) {
        destroyClusterEntry(entry);
        entriesRef.current.delete(id);
      }
    }

    // 새로 생긴 클러스터만 추가
    for (const [id, cluster] of newClusterMap) {
      if (entriesRef.current.has(id)) continue;
      const handler = () => onClusterClickRef.current(cluster);
      entriesRef.current.set(id, buildClusterEntry(cluster, map, zoom, handler));
    }
  }, [map, clusters, zoom]);

  // 언마운트 시 전체 정리
  useEffect(() => {
    return () => {
      for (const entry of entriesRef.current.values()) destroyClusterEntry(entry);
      entriesRef.current.clear();
    };
  }, []);

  return null;
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
