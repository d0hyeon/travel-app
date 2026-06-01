import { Box, type BoxProps } from '@mui/material';
import { Suspense, use, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { KakaoMapContext } from '../MapContext';
import type { MapProps } from '../types';
import { KakaoMapClusterOverlays } from './cluster/KakaoMapClusterOverlays';
import { ClusterProvider } from '../useClusterRegistry';
import { loadKakaoMap } from './loader';
import { useMapZoomLevel } from './useMapZoomLevel';
import { useViewportFit } from './useViewportFit';


const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 }

type Props = MapProps & Omit<BoxProps, 'ref' | 'autoFocus' | 'children'>

export default function KakaoMap({
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
  use(loadKakaoMap());
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [map, setMap] = useState<kakao.maps.Map | null>(null);

  useEffect(() => {
    if (!container) return;
    const coordinate = center ?? defaultCenter;
    const mapInstance = new kakao.maps.Map(container, {
      center: new kakao.maps.LatLng(coordinate.lat, coordinate.lng),
      level: 8,
    });
    setMap(mapInstance);
  }, [container]);

  useEffect(() => {
    if (!map || !onBoundsChange) return;
    const handler = () => {
      const bounds = map.getBounds();
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      onBoundsChange({ north: ne.getLat(), south: sw.getLat(), east: ne.getLng(), west: sw.getLng() });
    };
    kakao.maps.event.addListener(map, 'bounds_changed', handler);
    return () => { kakao.maps.event.removeListener(map, 'bounds_changed', handler); };
  }, [map, onBoundsChange]);

  useEffect(() => {
    if (map != null && center != null) {
      map.setCenter(new kakao.maps.LatLng(center.lat, center.lng));
    }
  }, [map, center?.lat, center?.lng]);

  const { extend: extendBound, fit: focusBounds } = useViewportFit(map);

  useImperativeHandle(ref, () => ({
    panTo: (lat: number, lng: number, level?: number) => {
      if (!map) return;
      if (level != null) map.setLevel(level);
      map.panTo(new kakao.maps.LatLng(lat, lng));
    },
    relayout: () => map?.relayout(),
    focus: focusBounds,
  }), [map]);

  const mapContextValue = useMemo(() => ({
    map,
    extendBound,
    config: { autoFocus, clustering },
  }), [map, extendBound, autoFocus, clustering]);

  return (
    <KakaoMapContext.Provider value={mapContextValue}>
      <Box ref={setContainer} position="relative" {...boxProps} />
      <Suspense>
        <ClusterProvider>
          <Renderer>{children}</Renderer>
          {clustering && <KakaoMapClusterOverlays gridSize={clusterGridSize} />}
        </ClusterProvider>
      </Suspense>
    </KakaoMapContext.Provider>
  );
}

function Renderer(props: Pick<Props, 'children'>) {
  const zoom = useMapZoomLevel();

  if (typeof props.children === 'function') {
    return props.children({ zoom })
  }

  return props.children;
}