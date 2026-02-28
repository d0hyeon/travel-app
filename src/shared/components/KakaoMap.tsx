import { Box, type BoxProps } from '@mui/material';
import { Suspense, createContext, use, useCallback, useEffect, useEffectEvent, useImperativeHandle, useMemo, useRef, useState, type ReactNode, type Ref } from 'react';
import '../lib/kakao';
import { loadKakaoMap } from '../lib/kakao';
import { useVariation } from '~shared/hooks/useVariation';


type AutoFocus = 'marker' | 'path' | false;

interface MarkerData {
  id: string;
  position: kakao.maps.LatLng;
  label?: string;
  variant?: 'default' | 'selected' | 'disabled';
  color?: string;
  opacity?: number;
  onClick?: () => void;
}

interface MapContextValue {
  map: kakao.maps.Map | null;
  extendBound: (value: kakao.maps.LatLng) => void;
  registerMarker: (data: MarkerData) => void;
  unregisterMarker: (id: string) => void;
  config: { autoFocus: AutoFocus; clustering: boolean; clusterGridSize: number };
}
const MapContext = createContext<MapContextValue | null>(null);

export interface KakaoMapRef {
  panTo: (lat: number, lng: number, level?: number) => void
  /** 맵 컨테이너 크기 변경 후 호출하여 맵을 다시 렌더링 */
  relayout: () => void;
  focus: () => void;
}

export interface KakaoMapProps extends Omit<BoxProps, 'ref' | "autoFocus"> {
  defaultCenter?: { lat: number; lng: number };
  ref?: Ref<KakaoMapRef>;
  children?: ReactNode;
  autoFocus?: AutoFocus;
  /** 마커 클러스터링 활성화 */
  clustering?: boolean;
  /** 클러스터링 픽셀 거리 (이 거리 이내의 마커들을 클러스터로 묶음, 기본값 60px) */
  clusterGridSize?: number;
}

const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 }

export function KakaoMap(props: KakaoMapProps) {
  return (
    <Suspense fallback="로딩">
      <Resolved {...props} />
    </Suspense>
  )
};

function Resolved({
  defaultCenter = DEFAULT_CENTER,
  ref,
  autoFocus = 'marker',
  clustering = false,
  clusterGridSize = 60,
  children,
  ...boxProps
}: KakaoMapProps) {
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

      // 줌 변경 감지
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

  // 마커 레지스트리
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

  // 클러스터링 계산
  const clusters = useMemo(() => {
    if (!clustering || !map) return null;

    const markers = Array.from(markerRegistryRef.current.values());
    return calculateClusters(markers, map, clusterGridSize);
  }, [clustering, map, clusterGridSize, markerVersion, zoom]);

  // ref로 메서드 노출
  useImperativeHandle(ref, () => ({
    panTo: (lat: number, lng: number, level?: number) => {
      if (!map) return;
      if (level != null) map.setLevel(level)
      map.panTo(new kakao.maps.LatLng(lat, lng))
    },
    relayout: () => {
      if (!map) return
      // relayout은 카카오맵 API에 존재하지만 타입 정의에 없음
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

  // 클러스터 클릭 핸들러
  const handleClusterClick = useCallback((cluster: Cluster) => {
    if (!map) return;
    const bounds = new kakao.maps.LatLngBounds();
    cluster.markers.forEach(m => bounds.extend(m.position));
    map.setBounds(bounds);
  }, [map]);

  return (
    <MapContext.Provider value={value}>
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
    </MapContext.Provider>
  )
};

interface PathProps extends Omit<kakao.maps.PolylineOptions, 'path'> {
  coordinates: { lat: number, lng: number }[]
}

KakaoMap.Path = ({ coordinates, ...props }: PathProps) => {
  const context = use(MapContext);
  const path = coordinates.map(x => new kakao.maps.LatLng(x.lat, x.lng));

  useEffect(() => {
    if (context?.map == null) return;

    const polyline = new kakao.maps.Polyline({
      path,
      strokeWeight: 4,
      strokeColor: '#1976d2',
      strokeOpacity: 0.8,
      strokeStyle: 'solid',
      ...props,
    })
    polyline.setMap(context.map);
    if (context.config.autoFocus === 'path') {
      path.forEach((position) => context.extendBound(position));
    }
    return () => polyline.setMap(null);
  }, [path, context])

  return null;
}

export interface MapMarker {
  lat: number
  lng: number
  label?: string
  variant?: 'default' | 'selected' | 'disabled'
}

interface MarkerProps {
  id?: string
  lat: number
  lng: number
  label?: string
  tooltip?: string | string[]
  variant?: 'default' | 'selected' | 'disabled'
  color?: string
  opacity?: number
  onClick?: (props: MapMarker) => void;
  onContextMenu?: (props: MapMarker) => void;
}

KakaoMap.Marker = ({ id, lat, lng, label, tooltip, variant, color, opacity = 1, onClick = () => { }, onContextMenu }: MarkerProps) => {
  const context = use(MapContext);
  const position = useMemo(() => new kakao.maps.LatLng(lat, lng), [lat, lng]);
  const markerId = useMemo(() => id ?? `${lat}_${lng}`, [id, lat, lng]);

  const [zoom, setZoom] = useState<number | undefined>(context?.map?.getLevel());

  // 클러스터링 모드일 때 마커 등록
  const handleMarkerClick = useEffectEvent(() => onClick({ lat, lng, label, variant }));

  useEffect(() => {
    if (!context?.config.clustering) return;

    context.registerMarker({
      id: markerId,
      position,
      label,
      variant,
      color,
      opacity,
      onClick: handleMarkerClick,
    });

    return () => context.unregisterMarker(markerId);
  }, [context, markerId, position, label, variant, color, opacity]);

  // 클러스터링 모드에서 클러스터에 포함되면 렌더링 안함
  // 픽셀 기반 클러스터링이므로 항상 클러스터 로직에 위임
  const shouldRender = useMemo(() => {
    if (!context?.config.clustering) return true;
    // 클러스터링 활성화시 개별 마커 숨김 (클러스터 오버레이가 대신 표시)
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
    const markerImage = getMarkerImage(variant, color, opacity, zoom);

    return new kakao.maps.Marker({
      position,
      image: markerImage,
    })
  }, [position, variant, color, zoom]);




  useEffect(function renderLabel() {
    if (context?.map == null || label == null || !shouldRender) return;

    const { map } = context;
    const scale = getZoomScale(zoom);
    // 마커 높이(36px * scale) 기준으로 라벨 위치 계산
    // yAnchor: 1 = 라벨 하단이 position에, 2 = 라벨 하단이 마커 위에
    const yAnchor = 1 + (36 * scale + 4) / 20; // 마커 위 4px 간격
    const overlay = new kakao.maps.CustomOverlay({
      position,
      content: createLabelContent(label, variant, color, opacity, zoom),
      yAnchor,
    });

    overlay.setMap(map);
    return () => overlay.setMap(null);
  }, [context, label, color, opacity, zoom, shouldRender]);

  useEffect(function renderMarker() {
    if (marker == null || context?.map == null || !shouldRender) return;
    marker.setMap(context.map);

    if (context.config.autoFocus === 'marker') {
      context.extendBound(position);
    }
    return () => marker.setMap(null);
  }, [marker, position, context, shouldRender])


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

  // Tooltip on hover
  useEffect(function renderTooltip() {
    if (context?.map == null || marker == null || tooltip == null || !shouldRender) return;

    const { map } = context;
    const scale = getZoomScale(zoom);
    // yAnchor: 마커(36px * scale) 바로 위에 배치
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




function getMarkerImage(
  variant?: MapMarker['variant'],
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
  variant?: MapMarker['variant'],
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


/**
 * 줌 레벨에 따른 스케일 계산
 * - 카카오맵 줌 레벨: 1(가장 확대) ~ 14(가장 축소)
 * - 기준 레벨(BASE_LEVEL)에서 scale = 1
 */
const ZOOM_SCALE_CONFIG = {
  BASE_LEVEL: 8,    // 기준 레벨 (이 레벨에서 scale = 1)
  MIN_SCALE: 0.6,   // 최소 스케일 (축소 시)
  MAX_SCALE: 1.4,   // 최대 스케일 (확대 시)
  RATE: 0.08,       // 레벨당 변화율
}

function getZoomScale(level: number = 8): number {
  const { BASE_LEVEL, MIN_SCALE, MAX_SCALE, RATE } = ZOOM_SCALE_CONFIG;
  const scale = 1 + (BASE_LEVEL - level) * RATE;
  return Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale));
}

// ============ 클러스터링 ============

interface Cluster {
  id: string;
  center: kakao.maps.LatLng;
  markers: MarkerData[];
}

/**
 * 픽셀 기반 클러스터링 알고리즘
 * 화면상 픽셀 거리를 기준으로 마커를 그룹화
 * - 줌 레벨 변경 시 자동으로 클러스터링 범위가 조정됨
 */
function calculateClusters(
  markers: MarkerData[],
  map: kakao.maps.Map,
  gridSize: number
): Cluster[] {
  if (markers.length === 0) return [];

  // getProjection은 카카오맵 API에 존재하지만 타입 정의에 없음
  const projection = (map as any).getProjection() as {
    pointFromCoords: (latlng: kakao.maps.LatLng) => { x: number; y: number };
  };
  const clusters: Cluster[] = [];
  const processed = new Set<string>();

  // 각 마커의 픽셀 좌표 계산
  const markerPixels = markers.map(marker => ({
    marker,
    pixel: projection.pointFromCoords(marker.position),
  }));

  // 각 마커에 대해 클러스터 탐색
  markerPixels.forEach(({ marker, pixel }) => {
    if (processed.has(marker.id)) return;

    // 이 마커와 가까운 마커들 찾기
    const nearbyMarkers: MarkerData[] = [marker];
    processed.add(marker.id);

    markerPixels.forEach(({ marker: other, pixel: otherPixel }) => {
      if (processed.has(other.id)) return;

      // 픽셀 거리 계산
      const dx = pixel.x - otherPixel.x;
      const dy = pixel.y - otherPixel.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= gridSize) {
        nearbyMarkers.push(other);
        processed.add(other.id);
      }
    });

    // 2개 이상일 때만 클러스터로 생성
    if (nearbyMarkers.length >= 2) {
      // 클러스터 중심 계산
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
      // 단일 마커도 클러스터로 추가 (개별 표시용)
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
    // 기존 오버레이/마커 제거
    overlaysRef.current.forEach(overlay => overlay.setMap(null));
    overlaysRef.current = [];
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    clusters.forEach(cluster => {
      if (cluster.markers.length === 1) {
        // 단일 마커: 일반 마커로 표시
        const markerData = cluster.markers[0];
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

        // 클릭 이벤트 연결
        if (markerData.onClick) {
          kakao.maps.event.addListener(marker, 'click', markerData.onClick);
        }

        // 라벨 오버레이
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
      } else {
        // 클러스터: 숫자 원으로 표시
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