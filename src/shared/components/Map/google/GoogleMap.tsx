import { Box, type BoxProps } from '@mui/material';
import { Suspense, use, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { GoogleMapContext } from '../MapContext';
import type { MapProps } from '../types';
import { ClusterProvider } from '../useClusterRegistry';
import { GoogleMapClusterOverlays } from './cluster/GoogleMapClusterOverlays';
import { useBoundsChangeListener, useViewportFit } from './GoogleMap.hooks';
import { loadGoogleMaps } from './loader';
import { useMapZoomLevel } from './useMapZoomLevel';

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

type Props = MapProps & Omit<BoxProps, 'ref' | 'autoFocus' | 'children'>

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
  onBoundsChange,
  children,
  ...boxProps
}: Props) {
  use(loadGoogleMaps());
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  useEffect(() => {
    if (!container) return;
    setMap(
      new google.maps.Map(container, {
        center: center ?? defaultCenter,
        zoom: 10,
        disableDefaultUI: true,
        styles: PASTEL_MAP_STYLES,
      })
    )
  }, [container]);

  useEffect(() => {
    if (center != null) map?.setCenter(center);
  }, [map, center?.lat, center?.lng]);

  const { extend: extendBound, fit: focusBounds } = useViewportFit(map);

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

  const mapContextValue = useMemo(() => ({
    map,
    extendBound,
    config: { autoFocus, clustering, gridSize: clusterGridSize },
  }), [map, extendBound, autoFocus, clustering, clusterGridSize]);

  useBoundsChangeListener(map, onBoundsChange);

  return (
    <GoogleMapContext.Provider value={mapContextValue}>
      <Box ref={setContainer} position="relative" {...boxProps} />
      <Suspense>
        <ClusterProvider>
          <Resolved>{children}</Resolved>
          {clustering && <GoogleMapClusterOverlays gridSize={clusterGridSize} />}
        </ClusterProvider>
      </Suspense>
    </GoogleMapContext.Provider>
  );
}


function Resolved({ children }: Props) {
  const zoom = useMapZoomLevel();

  if (typeof children === 'function') return children({ zoom: ZOOM_MAX_LEVEL - zoom });
  return children;
}
