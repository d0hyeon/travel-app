import { Box, type BoxProps } from '@mui/material';
import { Suspense, createContext, use, useCallback, useEffect, useEffectEvent, useImperativeHandle, useMemo, useRef, useState, type ReactNode, type Ref } from 'react';
import { loadGoogleMaps } from './loader';
import type { AutoFocus, MapRef, MarkerProps, PathProps, Coordinate } from '../types';

interface MapContextValue {
  map: google.maps.Map | null;
  extendBound: (coord: Coordinate) => void;
  config: { autoFocus: AutoFocus };
}

const GoogleMapContext = createContext<MapContextValue | null>(null);

export interface GoogleMapImplProps extends Omit<BoxProps, 'ref' | 'autoFocus'> {
  defaultCenter?: Coordinate;
  ref?: Ref<MapRef>;
  children?: ReactNode;
  autoFocus?: AutoFocus;
  // 클러스터링은 추후 구현
  clustering?: boolean;
  clusterGridSize?: number;
}

const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 };

export function GoogleMapImpl(props: GoogleMapImplProps) {
  return (
    <Suspense fallback="로딩">
      <Resolved {...props} />
    </Suspense>
  );
}

function Resolved({
  defaultCenter = DEFAULT_CENTER,
  ref,
  autoFocus = 'marker',
  clustering = false,
  clusterGridSize = 60,
  children,
  ...boxProps
}: GoogleMapImplProps) {
  use(loadGoogleMaps());

  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const boundsRef = useRef<google.maps.LatLngBounds | null>(null);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    if (!container) return;

    const mapInstance = new google.maps.Map(container, {
      center: { lat: defaultCenter.lat, lng: defaultCenter.lng },
      zoom: 10,
      mapId: 'DEMO_MAP_ID', // Advanced Markers 사용시 필요
      disableDefaultUI: true

    });
    setMap(mapInstance);
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
        if (boundsRef.current) {
          map.fitBounds(boundsRef.current);
        }
      });
    }
  }, [map]);

  useImperativeHandle(ref, () => ({
    panTo: (lat: number, lng: number, zoom?: number) => {
      if (!map) return;
      map.panTo({ lat, lng });
      if (zoom != null) map.setZoom(zoom);
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
    config: { autoFocus },
  }), [map, extendBound, autoFocus]);

  return (
    <GoogleMapContext.Provider value={contextValue}>
      <Box ref={setContainer} position="relative" {...boxProps} />
      {children}
    </GoogleMapContext.Provider>
  );
}

export function GoogleMarker({
  lat,
  lng,
  label,
  tooltip,
  variant = 'default',
  color,
  opacity = 1,
  onClick,
  onContextMenu,
}: MarkerProps) {
  const context = use(GoogleMapContext);
  const markerRef = useRef<google.maps.Marker | null>(null);

  const markerColor = useMemo(() => {
    if (color) return color;
    const colors = {
      default: '#ef5350',
      selected: '#1976d2',
      disabled: '#9e9e9e',
    };
    return colors[variant];
  }, [variant, color]);

  useEffect(() => {
    if (!context?.map) return;

    // SVG 마커 with 흰색 내부 원
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 24 36">
        <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24c0-6.6-5.4-12-12-12z" fill="${markerColor}" fill-opacity="${opacity}"/>
        <circle cx="12" cy="11" r="4" fill="white"/>
      </svg>
    `;
    const svgUrl = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;

    const marker = new google.maps.Marker({
      position: { lat, lng },
      map: context.map,
      title: label,
      icon: {
        url: svgUrl,
        scaledSize: new google.maps.Size(28, 40),
        anchor: new google.maps.Point(14, 40),
      },
      opacity,
    });

    markerRef.current = marker;

    if (context.config.autoFocus === 'marker') {
      context.extendBound({ lat, lng });
    }

    return () => {
      marker.setMap(null);
      markerRef.current = null;
    };
  }, [context, lat, lng, label, markerColor, opacity]);

  // Click handler
  const handleClick = useEffectEvent(() => {
    onClick?.({ lat, lng, label, variant });
  });

  const handleContextMenu = useEffectEvent(() => {
    onContextMenu?.({ lat, lng, label, variant });
  });

  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;

    const clickListener = marker.addListener('click', handleClick);
    const contextMenuListener = marker.addListener('rightclick', handleContextMenu);

    return () => {
      google.maps.event.removeListener(clickListener);
      google.maps.event.removeListener(contextMenuListener);
    };
  }, []);

  // Tooltip on hover (InfoWindow)
  useEffect(() => {
    const marker = markerRef.current;
    if (!marker || !context?.map || !tooltip) return;

    const infoWindow = new google.maps.InfoWindow({
      content: `
        <style>.gm-ui-hover-effect { display: none !important; }</style>
        <div style="padding: 4px 8px; font-size: 12px; max-width: 200px;">${tooltip}</div>
      `,
      disableAutoPan: true,
    });

    const mouseoverListener = marker.addListener('mouseover', () => {
      infoWindow.open(context.map, marker);
    });

    const mouseoutListener = marker.addListener('mouseout', () => {
      infoWindow.close();
    });

    return () => {
      google.maps.event.removeListener(mouseoverListener);
      google.maps.event.removeListener(mouseoutListener);
      infoWindow.close();
    };
  }, [context?.map, tooltip]);

  // Label as custom overlay (always visible, no close button)
  useEffect(() => {
    if (!context?.map || !label) return;

    // 동적으로 클래스 생성 (SDK 로드 후에만 실행)
    class LabelOverlay extends google.maps.OverlayView {
      private div: HTMLDivElement | null = null;
      private position: google.maps.LatLng;
      private text: string;
      private bgColor: string;

      constructor(position: google.maps.LatLng, text: string, bgColor: string) {
        super();
        this.position = position;
        this.text = text;
        this.bgColor = bgColor;
      }

      onAdd() {
        this.div = document.createElement('div');
        this.div.style.cssText = `
          position: absolute;
          background: ${this.bgColor};
          color: white;
          padding: 2px 6px;
          border-radius: 10px;
          font-size: 11px;
          font-weight: bold;
          white-space: nowrap;
          pointer-events: none;
          transform: translate(-50%, -100%);
          margin-top: -40px;
        `;
        this.div.textContent = this.text;
        const panes = this.getPanes();
        panes?.overlayLayer.appendChild(this.div);
      }

      draw() {
        if (!this.div) return;
        const projection = this.getProjection();
        const pos = projection.fromLatLngToDivPixel(this.position);
        if (pos) {
          this.div.style.left = `${pos.x}px`;
          this.div.style.top = `${pos.y}px`;
        }
      }

      onRemove() {
        if (this.div?.parentNode) {
          this.div.parentNode.removeChild(this.div);
          this.div = null;
        }
      }
    }

    const overlay = new LabelOverlay(
      new google.maps.LatLng(lat, lng),
      label,
      markerColor
    );
    overlay.setMap(context.map);

    return () => overlay.setMap(null);
  }, [context?.map, lat, lng, label, markerColor]);

  return null;
}

export function GooglePath({
  coordinates,
  strokeColor = '#1976d2',
  strokeWeight = 4,
  strokeOpacity = 0.8,
}: PathProps) {
  const context = use(GoogleMapContext);

  useEffect(() => {
    if (!context?.map || coordinates.length < 2) return;

    const path = coordinates.map(c => ({ lat: c.lat, lng: c.lng }));

    const polyline = new google.maps.Polyline({
      path,
      strokeColor,
      strokeWeight,
      strokeOpacity,
      map: context.map,
    });

    if (context.config.autoFocus === 'path') {
      coordinates.forEach(coord => context.extendBound(coord));
    }

    return () => polyline.setMap(null);
  }, [context, coordinates, strokeColor, strokeWeight, strokeOpacity]);

  return null;
}

