import { Box, type BoxProps } from '@mui/material';
import { use, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { useVariation } from '~shared/hooks/useVariation';
import { KakaoMapContext } from '../MapContext';
import type { Coordinate, MapProps, MarkerData } from '../types';
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
  children,
  ...boxProps
}: Props) {
  use(loadKakaoMap());

  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [map, setMap] = useState<kakao.maps.Map | null>(null);
  const [zoom, setZoom] = useState(8);
  const [clusterZoom, setClusterZoom] = useState(8);

  useEffect(() => {
    const id = setTimeout(() => setClusterZoom(zoom), 200);
    return () => clearTimeout(id);
  }, [zoom]);

  useEffect(() => {
    if (container) {
      const map = new kakao.maps.Map(container, {
        center: new kakao.maps.LatLng(defaultCenter.lat, defaultCenter.lng),
        level: 8,
      })
      setMap(map)

      kakao.maps.event.addListener(map, 'zoom_changed', () => {
        setZoom(map.getLevel())
      })
    }
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

    const markers = Array.from(markerRegistryRef.current.values());
    return calculateClusters(markers, map, clusterGridSize);
  }, [clustering, map, clusterGridSize, markerVersion, clusterZoom]);

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

interface ClusterOverlaysProps {
  map: kakao.maps.Map;
  clusters: Cluster[];
  zoom: number;
  onClusterClick: (cluster: Cluster) => void;
}

function ClusterOverlays({ map, clusters, zoom, onClusterClick }: ClusterOverlaysProps) {
  const overlaysRef = useRef<kakao.maps.CustomOverlay[]>([]);
  const markersRef = useRef<kakao.maps.Marker[]>([]);
  const elRegistryRef = useRef<Array<{ el: HTMLElement; type: string; handler: EventListener }>>([]);

  useEffect(() => {
    elRegistryRef.current.forEach(({ el, type, handler }) => el.removeEventListener(type, handler));
    elRegistryRef.current = [];
    overlaysRef.current.forEach(overlay => overlay.setMap(null));
    overlaysRef.current = [];
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    clusters.forEach(cluster => {
      if (cluster.markers.length === 1) {
        const markerData = cluster.markers[0];

        if (markerData.thumbnailUrl) {
          const el = document.createElement('div');
          el.innerHTML = createThumbnailContent(markerData.thumbnailUrl, markerData.color);
          el.style.cursor = 'pointer';
          if (markerData.onClick) {
            el.addEventListener('click', markerData.onClick);
            elRegistryRef.current.push({ el, type: 'click', handler: markerData.onClick });
          }
          if (markerData.onContextMenu) {
            el.addEventListener('contextmenu', markerData.onContextMenu);
            elRegistryRef.current.push({ el, type: 'contextmenu', handler: markerData.onContextMenu });
          }

          const overlay = new kakao.maps.CustomOverlay({
            position: new kakao.maps.LatLng(markerData.position.lat, markerData.position.lng),
            content: el,
            yAnchor: 1.08,
            xAnchor: 0.5,
          });
          overlay.setMap(map);
          overlaysRef.current.push(overlay);
        } else {
          const markerImage = getMarkerImage(
            markerData.variant,
            markerData.color,
            markerData.opacity,
            zoom
          );

          const marker = new kakao.maps.Marker({
            position: new kakao.maps.LatLng(markerData.position.lat, markerData.position.lng),
            image: markerImage,
          });
          marker.setMap(map);
          markersRef.current.push(marker);

          if (markerData.onClick) {
            kakao.maps.event.addListener(marker, 'click', markerData.onClick);
          }
          if (markerData.onContextMenu) {
            kakao.maps.event.addListener(marker, 'rightclick', markerData.onContextMenu);
          }

          if (markerData.label) {
            const scale = getZoomScale(zoom);
            const yAnchor = 1 + (36 * scale + 4) / 20;
            const labelOverlay = new kakao.maps.CustomOverlay({
              position: new kakao.maps.LatLng(markerData.position.lat, markerData.position.lng),
              content: createLabelContent(
                markerData.label,
                markerData.variant,
                markerData.color,
                markerData.opacity,
                zoom
              ),
              yAnchor,
            });
            labelOverlay.setMap(map);
            overlaysRef.current.push(labelOverlay);
          }
        }
      } else {
        const content = document.createElement('div');
        content.innerHTML = createClusterContent(cluster.markers.length, zoom);
        content.style.cursor = 'pointer';
        const clusterClickHandler: EventListener = () => onClusterClick(cluster);
        content.addEventListener('click', clusterClickHandler);
        elRegistryRef.current.push({ el: content, type: 'click', handler: clusterClickHandler });

        const overlay = new kakao.maps.CustomOverlay({
          position: cluster.center,
          content,
          yAnchor: 0.5,
          xAnchor: 0.5,
        });

        overlay.setMap(map);
        overlaysRef.current.push(overlay);
      }
    });

    return () => {
      elRegistryRef.current.forEach(({ el, type, handler }) => el.removeEventListener(type, handler));
      elRegistryRef.current = [];
      overlaysRef.current.forEach(overlay => overlay.setMap(null));
      overlaysRef.current = [];
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
    };
  }, [map, clusters, zoom, onClusterClick]);

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
