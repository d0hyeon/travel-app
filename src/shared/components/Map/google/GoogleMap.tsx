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
  id,
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

    const svgMarker = {
      path: 'M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24c0-6.6-5.4-12-12-12z',
      fillColor: markerColor,
      fillOpacity: opacity,
      strokeWeight: 0,
      scale: 1.2,
      anchor: new google.maps.Point(12, 36),
    };

    const marker = new google.maps.Marker({
      position: { lat, lng },
      map: context.map,
      title: label,
      icon: svgMarker,
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

  // Label as InfoWindow (optional)
  useEffect(() => {
    if (!context?.map || !markerRef.current || !label) return;

    const infoWindow = new google.maps.InfoWindow({
      content: `<div style="
        background: ${markerColor};
        color: white;
        padding: 2px 6px;
        border-radius: 10px;
        font-size: 11px;
        font-weight: bold;
        white-space: nowrap;
      ">${label}</div>`,
      disableAutoPan: true,
    });

    infoWindow.open(context.map, markerRef.current);

    return () => infoWindow.close();
  }, [context?.map, label, markerColor]);

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
