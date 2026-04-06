import { Box, type BoxProps } from '@mui/material';
import { Suspense, createContext, use, useCallback, useEffect, useEffectEvent, useImperativeHandle, useMemo, useRef, useState, type ReactNode, type Ref } from 'react';
import { useVariation } from '~shared/hooks/useVariation';
import type { AutoFocus, MapRef, MarkerProps, PathProps } from '../types';
import './loader';
import { loadKakaoMap } from './loader';

interface MarkerData {
  id: string;
  position: kakao.maps.LatLng;
  label?: string;
  tooltip?: string | string[];
  variant?: 'default' | 'selected' | 'disabled';
  color?: string;
  opacity?: number;
  thumbnailUrl?: string;
  onClick?: () => void;
  onContextMenu?: () => void;
}

interface MapContextValue {
  map: kakao.maps.Map | null;
  extendBound: (value: kakao.maps.LatLng) => void;
  registerMarker: (data: MarkerData) => void;
  unregisterMarker: (id: string) => void;
  config: { autoFocus: AutoFocus; clustering: boolean; clusterGridSize: number };
}
const KakaoMapContext = createContext<MapContextValue | null>(null);

export interface KakaoMapImplProps extends Omit<BoxProps, 'ref' | "autoFocus"> {
  defaultCenter?: { lat: number; lng: number };
  ref?: Ref<MapRef>;
  children?: ReactNode;
  autoFocus?: AutoFocus;
  clustering?: boolean;
  clusterGridSize?: number;
  showMyLocation?: boolean;
}

const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 }

export function KakaoMapImpl(props: KakaoMapImplProps) {
  return (
    <Suspense fallback="로딩">
      <Resolved {...props} />
    </Suspense>
  )
}

function Resolved({
  defaultCenter = DEFAULT_CENTER,
  ref,
  autoFocus = 'marker',
  clustering = false,
  clusterGridSize = 60,
  showMyLocation = false,
  children,
  ...boxProps
}: KakaoMapImplProps) {
  use(loadKakaoMap());

  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [map, setMap] = useState<kakao.maps.Map | null>(null);
  const [zoom, setZoom] = useState(8);

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
  const extendBound = useCallback((value: kakao.maps.LatLng) => {
    if (map == null) return;
    if (boundStatusRef.current === 'closed') {
      boundsRef.current = new kakao.maps.LatLngBounds();
      boundStatusRef.current = 'open';
    }

    boundsRef.current.extend(value);
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
  }, [clustering, map, clusterGridSize, markerVersion, zoom]);

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
    cluster.markers.forEach(m => bounds.extend(m.position));
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

export function KakaoMarker({ id, lat, lng, label, tooltip, variant, color, opacity = 1, thumbnailUrl, onClick = () => { }, onContextMenu }: MarkerProps) {
  const context = use(KakaoMapContext);
  const position = useMemo(() => new kakao.maps.LatLng(lat, lng), [lat, lng]);
  const markerId = useMemo(() => id ?? `${lat}_${lng}`, [id, lat, lng]);

  const [zoom, setZoom] = useState<number | undefined>(context?.map?.getLevel());

  const handleMarkerClick = useEffectEvent(() => onClick({ lat, lng, label, variant }));
  const handleMarkerContextMenu = useEffectEvent(() => onContextMenu?.({ lat, lng, label, variant }));

  useEffect(() => {
    if (!context?.config.clustering) return;

    context.registerMarker({
      id: markerId,
      position,
      label,
      tooltip,
      variant,
      color,
      opacity,
      thumbnailUrl,
      onClick: handleMarkerClick,
      onContextMenu: handleMarkerContextMenu,
    });

    return () => context.unregisterMarker(markerId);
  }, [context, markerId, position, label, variant, color, opacity, thumbnailUrl]);

  const shouldRender = useMemo(() => {
    if (!context?.config.clustering) return true;
    return false;
  }, [context?.config.clustering]);

  useEffect(() => {
    if (context?.map == null) return;
    const handler = () => {
      setZoom(context.map?.getLevel())
    }

    kakao.maps.event.addListener(context.map, 'zoom_changed', handler)
    return () => {
      if (context.map) {
        kakao.maps.event.removeListener(context.map, 'zoom_changed', handler)
      }
    }
  }, [context?.map])

  const marker = useMemo(() => {
    if (thumbnailUrl) return null; // thumbnail은 CustomOverlay로 렌더링
    const markerImage = getMarkerImage(variant, color, opacity, zoom);

    return new kakao.maps.Marker({
      position,
      image: markerImage,
    })
  }, [position, variant, color, zoom, thumbnailUrl]);

  useEffect(function renderLabel() {
    if (context?.map == null || label == null || !shouldRender || thumbnailUrl) return;

    const { map } = context;
    const scale = getZoomScale(zoom);
    const yAnchor = 1 + (36 * scale + 4) / 20;
    const overlay = new kakao.maps.CustomOverlay({
      position,
      content: createLabelContent(label, variant, color, opacity, zoom),
      yAnchor,
    });

    overlay.setMap(map);
    return () => overlay.setMap(null);
  }, [context, label, color, opacity, zoom, shouldRender, thumbnailUrl]);

  useEffect(function renderMarker() {
    if (marker == null || context?.map == null || !shouldRender) return;
    marker.setMap(context.map);

    if (context.config.autoFocus === 'marker') {
      context.extendBound(position);
    }
    return () => marker.setMap(null);
  }, [marker, position, context, shouldRender])

  useEffect(function renderThumbnailOverlay() {
    if (!thumbnailUrl || context?.map == null || !shouldRender) return;

    if (context.config.autoFocus === 'marker') {
      context.extendBound(position);
    }

    const el = document.createElement('div');
    el.innerHTML = createThumbnailContent(thumbnailUrl, color);
    el.style.cursor = 'pointer';
    el.addEventListener('click', () => onClick({ lat, lng, label, variant }));
    if (onContextMenu) {
      el.addEventListener('contextmenu', () => onContextMenu({ lat, lng, label, variant }));
    }

    const overlay = new kakao.maps.CustomOverlay({
      position,
      content: el,
      yAnchor: 1.08,
      xAnchor: 0.5,
    });

    overlay.setMap(context.map);
    return () => overlay.setMap(null);
  }, [thumbnailUrl, context, position, color, shouldRender]);

  const clickHandler = useEffectEvent(() => onClick({ lat, lng, label, variant }));
  const contextMenuHandler = useEffectEvent(() => onContextMenu?.({ lat, lng, label, variant }))

  useEffect(function subscribeEvnet() {
    if (marker != null && shouldRender) {
      kakao.maps.event.addListener(marker, 'click', clickHandler);
      kakao.maps.event.addListener(marker, 'rightclick', contextMenuHandler)

      return () => {
        kakao.maps.event.removeListener(marker, 'click', clickHandler);
        kakao.maps.event.removeListener(marker, 'rightclick', contextMenuHandler)
      }
    }
  }, [marker, shouldRender]);

  useEffect(function renderTooltip() {
    if (context?.map == null || marker == null || tooltip == null || !shouldRender) return;

    const { map } = context;
    const scale = getZoomScale(zoom);
    const yAnchor = 1 + (36 * scale) / 30;
    const overlay = new kakao.maps.CustomOverlay({
      position,
      content: createTooltipContent(tooltip, zoom),
      yAnchor,
    });

    const showTooltip = () => overlay.setMap(map);
    const hideTooltip = () => overlay.setMap(null);

    kakao.maps.event.addListener(marker, 'mouseover', showTooltip);
    kakao.maps.event.addListener(marker, 'mouseout', hideTooltip);

    return () => {
      overlay.setMap(null);
      kakao.maps.event.removeListener(marker, 'mouseover', showTooltip);
      kakao.maps.event.removeListener(marker, 'mouseout', hideTooltip);
    };
  }, [context, marker, position, tooltip, zoom, shouldRender]);

  return null;
}

export function KakaoPath({ coordinates, strokeColor, strokeWeight, strokeOpacity, strokeStyle }: PathProps) {
  const context = use(KakaoMapContext);
  const path = coordinates.map(x => new kakao.maps.LatLng(x.lat, x.lng));

  useEffect(() => {
    if (context?.map == null) return;

    const polyline = new kakao.maps.Polyline({
      path,
      strokeWeight: strokeWeight ?? 4,
      strokeColor: strokeColor ?? '#1976d2',
      strokeOpacity: strokeOpacity ?? 0.8,
      strokeStyle: strokeStyle ?? 'solid',
    })
    polyline.setMap(context.map);
    if (context.config.autoFocus === 'path') {
      path.forEach((position) => context.extendBound(position));
    }
    return () => polyline.setMap(null);
  }, [path, context])

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

function getMarkerImage(
  variant?: MarkerProps['variant'],
  customColor?: string,
  opacity = 1,
  level: number = 8,
): kakao.maps.MarkerImage | undefined {
  const colors = {
    default: '#ef5350',
    selected: '#1976d2',
    disabled: '#9e9e9e',
  }

  const scale = getZoomScale(level);

  const color = customColor ?? colors[variant ?? 'default']
  const svgMarker = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="36" viewBox="0 0 24 36">
      <path fill="${color}" fill-opacity="${opacity}" d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24c0-6.6-5.4-12-12-12z"/>
      <circle fill="white" fill-opacity="${opacity}" cx="12" cy="12" r="5"/>
    </svg>
  `
  const encodedSvg = encodeURIComponent(svgMarker)
  const dataUrl = `data:image/svg+xml,${encodedSvg}`

  return new kakao.maps.MarkerImage(
    dataUrl,
    new kakao.maps.Size(24 * scale, 36 * scale),
    { offset: new kakao.maps.Point(12 * scale, 36 * scale) }
  )
}

function createLabelContent(
  label: string,
  variant?: MarkerProps['variant'],
  customColor?: string,
  opacity = 1,
  level: number = 8
): string {
  const bgColors = {
    default: '#ef5350',
    selected: '#1976d2',
    disabled: '#9e9e9e',
  }
  const bg = customColor ?? bgColors[variant ?? 'default']
  const scale = getZoomScale(level);
  const fontSize = Math.round(11 * scale);
  const paddingV = Math.round(2 * scale);
  const paddingH = Math.round(6 * scale);

  return `
    <div style="
      background: ${bg};
      color: white;
      padding: ${paddingV}px ${paddingH}px;
      border-radius: 10px;
      font-size: ${fontSize}px;
      font-weight: bold;
      white-space: nowrap;
      opacity: ${opacity};
    ">${label}</div>
  `
}

function createTooltipContent(tooltip: string | string[], level: number = 8): string {
  const lines = Array.isArray(tooltip) ? tooltip : [tooltip]
  const content = lines.map(line => `<div>${line}</div>`).join('')
  const scale = getZoomScale(level);
  const fontSize = Math.round(12 * scale);
  const paddingV = Math.round(8 * scale);
  const paddingH = Math.round(12 * scale);

  return `
    <div style="
      position: relative;
      background: white;
      color: #333;
      padding: ${paddingV}px ${paddingH}px;
      border-radius: 8px;
      font-size: ${fontSize}px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      white-space: nowrap;
      pointer-events: none;
    ">
      ${content}
      <div style="
        position: absolute;
        bottom: -6px;
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 0;
        border-left: 6px solid transparent;
        border-right: 6px solid transparent;
        border-top: 6px solid white;
      "></div>
    </div>
  `
}

const ZOOM_SCALE_CONFIG = {
  BASE_LEVEL: 8,
  MIN_SCALE: 0.6,
  MAX_SCALE: 1.4,
  RATE: 0.08,
}

function getZoomScale(level: number = 8): number {
  const { BASE_LEVEL, MIN_SCALE, MAX_SCALE, RATE } = ZOOM_SCALE_CONFIG;
  const scale = 1 + (BASE_LEVEL - level) * RATE;
  return Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale));
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
    pixel: projection.pointFromCoords(marker.position),
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
        totalLat += m.position.getLat();
        totalLng += m.position.getLng();
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
        center: marker.position,
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

  useEffect(() => {
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
          if (markerData.onClick) el.addEventListener('click', markerData.onClick);
          if (markerData.onContextMenu) el.addEventListener('contextmenu', markerData.onContextMenu);

          const overlay = new kakao.maps.CustomOverlay({
            position: markerData.position,
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
            position: markerData.position,
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
              position: markerData.position,
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
        content.addEventListener('click', () => onClusterClick(cluster));

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
