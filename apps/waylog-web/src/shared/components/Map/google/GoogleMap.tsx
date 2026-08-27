import { Box, type BoxProps } from '@mui/material';
import { Suspense, use, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { pastelMapStyle, visitedRegionMapStyle } from '@waylog/domains/modules/map';
import { GoogleMapContext } from '../MapContext';
import type { MapProps } from '../types';
import { ClusterProvider } from '../useClusterRegistry';
import { GoogleMapClusterOverlays } from './cluster/GoogleMapClusterOverlays';
import { useBoundsChangeListener, useViewportFit } from './GoogleMap.hooks';
import { loadGoogleMaps } from './loader';
import { useMapZoomLevel } from './useMapZoomLevel';

const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 };
const ZOOM_MAX_LEVEL = 22;


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
  styleVariant = 'pastel',
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
        styles: styleVariant === 'visited-region' ? visitedRegionMapStyle : pastelMapStyle,
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
