import { Suspense, createContext, use, useCallback, useEffect, useEffectEvent, useImperativeHandle, useMemo, useRef, useState, type ReactNode, type Ref } from 'react'
import { Box, type BoxProps } from '@mui/material'
import { loadKakaoMap } from '../lib/kakao'
import '../lib/kakao'


type AutoFocus = 'marker' | 'path' | false;

interface MapContextValue {
  map: kakao.maps.Map | null;
  extendBound: (value: kakao.maps.LatLng) => void;
  config: { autoFocus: AutoFocus };
}
const MapContext = createContext<MapContextValue | null>(null);

export interface KakaoMapRef {
  panTo: (lat: number, lng: number, level?: number) => void
}

export interface KakaoMapProps extends Omit<BoxProps, 'ref' | "autoFocus"> {
  defaultCenter?: { lat: number; lng: number };
  ref?: Ref<KakaoMapRef>;
  children?: ReactNode;
  autoFocus?: AutoFocus;
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
  ...boxProps
}: KakaoMapProps) {
  use(loadKakaoMap());

  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [map, setMap] = useState<kakao.maps.Map | null>(null);

  useEffect(() => {
    if (container) {
      const map = new kakao.maps.Map(container, {
        center: new kakao.maps.LatLng(defaultCenter.lat, defaultCenter.lng),
        level: 8,
      })
      setMap(map)
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

  // ref로 메서드 노출
  useImperativeHandle(ref, () => ({
    panTo: (lat: number, lng: number, level?: number) => {
      if (!map) return
      map.setCenter(new kakao.maps.LatLng(lat, lng))
      if (level != null) map.setLevel(level)
    },
  }), [map]);

  const value = useMemo(() => {
    return {
      map,
      extendBound,
      config: { autoFocus }
    }
  }, [map, autoFocus])

  return (
    <MapContext.Provider value={value}>
      <Box ref={setContainer} position="relative" {...boxProps} />
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

KakaoMap.Marker = ({ lat, lng, label, tooltip, variant, color, opacity = 1, onClick = () => { }, onContextMenu }: MarkerProps) => {
  const context = use(MapContext);
  const position = useMemo(() => new kakao.maps.LatLng(lat, lng), [lat, lng]);

  const [zoom, setZoom] = useState<number | undefined>(context?.map?.getLevel());

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
    if (context?.map == null || label == null) return;

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
  }, [context, label, color, zoom]);

  useEffect(function renderMarker() {
    if (marker == null || context?.map == null) return;
    marker.setMap(context.map);

    if (context.config.autoFocus === 'marker') {
      context.extendBound(position);
    }
    return () => marker.setMap(null);
  }, [marker, position, context])


  const clickHandler = useEffectEvent(() => onClick({ lat, lng, label, variant }));
  const contextMenuHandler = useEffectEvent(() => onContextMenu?.({ lat, lng, label, variant }))

  useEffect(function subscribeEvnet() {
    if (marker != null) {
      kakao.maps.event.addListener(marker, 'click', clickHandler);
      kakao.maps.event.addListener(marker, 'rightclick', contextMenuHandler)

      return () => {
        kakao.maps.event.removeListener(marker, 'click', clickHandler);
        kakao.maps.event.removeListener(marker, 'rightclick', contextMenuHandler)
      }
    }
  }, [marker]);

  // Tooltip on hover
  useEffect(function renderTooltip() {
    if (context?.map == null || marker == null || tooltip == null) return;

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
  }, [context, marker, position, tooltip, zoom]);

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


function useVariation<T>(initialValue?: T) {
  const ref = useRef<T>(initialValue);

  return [
    () => ref.current,
    (next: T) => ref.current = next,
  ] as const;
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