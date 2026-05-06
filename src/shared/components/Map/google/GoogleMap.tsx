import { Box, type BoxProps } from '@mui/material';
import { createContext, Suspense, use, useCallback, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { GoogleMapContext } from '../MapContext';
import { useMarkerRegistry } from '../useMarkerRegistry';
import type { MapProps, MarkerData } from '../types';
import { loadGoogleMaps } from './loader';
import { GoogleMapClusterOverlays } from './GoogleMapClusterOverlays';
import { useViewportFit } from './useViewportFit';

interface GoogleClusterContextValue {
  map: google.maps.Map;
  registryRef: React.RefObject<Map<string, MarkerData>>;
  version: number;
  zoom: number;
  gridSize: number;
  registerMarker: (data: MarkerData) => void;
  unregisterMarker: (id: string) => void;
}

export const GoogleClusterContext = createContext<GoogleClusterContextValue | null>(null);

const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 };
const ZOOM_MAX_LEVEL = 22;

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
  center,
  defaultCenter = DEFAULT_CENTER,
  ref,
  autoFocus = 'marker',
  clustering = false,
  clusterGridSize = 60,
  children,
  ...boxProps
}: Props) {
  use(loadGoogleMaps());

  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [zoom, setZoom] = useState(10);
  const [clusterZoom, setClusterZoom] = useState(10);

  // clusterZoom은 zoom 변경 직후 클러스터 재계산이 튀는 것을 방지하기 위해 debounce
  useEffect(() => {
    const id = setTimeout(() => setClusterZoom(zoom), 200);
    return () => clearTimeout(id);
  }, [zoom]);

  useEffect(() => {
    if (!container) return;
    const coordinate = center ?? defaultCenter;
    const mapInstance = new google.maps.Map(container, {
      center: { lat: coordinate.lat, lng: coordinate.lng },
      zoom,
      disableDefaultUI: true,
      styles: PASTEL_MAP_STYLES,
    });

    const zoomListener = mapInstance.addListener('zoom_changed', () => {
      setZoom(mapInstance.getZoom() ?? 10);
    });

    setMap(mapInstance);

    return () => {
      google.maps.event.removeListener(zoomListener);
    };
  }, [container]);

  useEffect(() => {
    if (map != null && center != null) {
      map.setCenter(center);
    }
  }, [map, center?.lat, center?.lng]);

  const { extend: extendBound, fit: focusBounds } = useViewportFit(map);
  const { registryRef, version, registerMarker, unregisterMarker } = useMarkerRegistry();

  useImperativeHandle(ref, () => ({
    panTo: (lat: number, lng: number, z?: number) => {
      if (!map) return;
      map.panTo({ lat, lng });
      if (z != null) map.setZoom(ZOOM_MAX_LEVEL - z);
    },
    relayout: () => {
      if (!map) return;
      google.maps.event.trigger(map, 'resize');
    },
    focus: focusBounds,
  }), [map, focusBounds]);

  const handleClusterClick = useCallback((markers: MarkerData[]) => {
    if (!map) return;
    const bounds = new google.maps.LatLngBounds();
    markers.forEach(m => bounds.extend({ lat: m.position.lat, lng: m.position.lng }));
    map.fitBounds(bounds);
  }, [map]);

  const mapContextValue = useMemo(() => ({
    map,
    extendBound,
    config: { autoFocus },
  }), [map, extendBound, autoFocus]);

  const clusterContextValue = useMemo(() => (
    clustering && map
      ? { map, registryRef, version, zoom: clusterZoom, gridSize: clusterGridSize, registerMarker, unregisterMarker }
      : null
  ), [clustering, map, registryRef, version, clusterZoom, clusterGridSize, registerMarker, unregisterMarker]);

  return (
    <GoogleMapContext.Provider value={mapContextValue}>
      <Box ref={setContainer} position="relative" {...boxProps} />
      <Suspense>
        {clusterContextValue ? (
          <GoogleClusterContext.Provider value={clusterContextValue}>
            {typeof children === 'function' ? children({ zoom: ZOOM_MAX_LEVEL - zoom }) : children}
            <GoogleMapClusterOverlays onClusterClick={handleClusterClick} />
          </GoogleClusterContext.Provider>
        ) : (
          typeof children === 'function' ? children({ zoom: ZOOM_MAX_LEVEL - zoom }) : children
        )}
      </Suspense>
    </GoogleMapContext.Provider>
  );
}
