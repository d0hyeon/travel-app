import { Box, type BoxProps } from '@mui/material';
import { createContext, Suspense, use, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { KakaoMapContext } from '../MapContext';
import { useMarkerRegistry } from '../useMarkerRegistry';
import type { MapBounds, MapProps, MarkerData } from '../types';
import { loadKakaoMap } from './loader';
import { KakaoMapClusterOverlays } from './KakaoMapClusterOverlays';
import { useViewportFit } from './useViewportFit';

interface KakaoClusterContextValue {
  map: kakao.maps.Map;
  registryRef: React.RefObject<Map<string, MarkerData>>;
  version: number;
  zoom: number;
  gridSize: number;
  registerMarker: (data: MarkerData) => void;
  unregisterMarker: (id: string) => void;
}

export const KakaoClusterContext = createContext<KakaoClusterContextValue | null>(null);

const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 }

type Props = MapProps & Omit<BoxProps, 'ref' | 'autoFocus'>

export default function KakaoMap({
  center,
  defaultCenter = DEFAULT_CENTER,
  ref,
  autoFocus = 'marker',
  clustering = false,
  clusterGridSize = 60,
  children,
  ...boxProps
}: Props) {
  use(loadKakaoMap());

  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [map, setMap] = useState<kakao.maps.Map | null>(null);
  const [zoom, setZoom] = useState(8);
  const [clusterZoom, setClusterZoom] = useState(8);


  // clusterZoom은 zoom 변경 직후 클러스터 재계산이 튀는 것을 방지하기 위해 debounce
  useEffect(() => {
    const id = setTimeout(() => setClusterZoom(zoom), 200);
    return () => clearTimeout(id);
  }, [zoom]);

  useEffect(() => {
    if (!container) return;
    const coordinate = center ?? defaultCenter;
    const mapInstance = new kakao.maps.Map(container, {
      center: new kakao.maps.LatLng(coordinate.lat, coordinate.lng),
      level: zoom,
    });
    setMap(mapInstance);

    const zoomHandler = () => setZoom(mapInstance.getLevel());
    kakao.maps.event.addListener(mapInstance, 'zoom_changed', zoomHandler);
    return () => {
      kakao.maps.event.removeListener(mapInstance, 'zoom_changed', zoomHandler);
    };
  }, [container]);

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

  const handleClusterClick = useCallback((markers: MarkerData[]) => {
    if (!map) return;
    const bounds = new kakao.maps.LatLngBounds();
    markers.forEach(m => bounds.extend(new kakao.maps.LatLng(m.position.lat, m.position.lng)));
    map.setBounds(bounds);
  }, [map]);

  const mapContextValue = useMemo(() => ({
    map,
    extendBound,
    config: { autoFocus },
  }), [map, extendBound, autoFocus]);

  const { registryRef, version, registerMarker, unregisterMarker } = useMarkerRegistry();
  const clusterContextValue = useMemo(() => (
    clustering && map
      ? { map, registryRef, version, zoom: clusterZoom, gridSize: clusterGridSize, registerMarker, unregisterMarker }
      : null
  ), [clustering, map, registryRef, version, clusterZoom, clusterGridSize, registerMarker, unregisterMarker]);

  return (
    <KakaoMapContext.Provider value={mapContextValue}>
      <Box ref={setContainer} position="relative" {...boxProps} />
      <Suspense>
        {clusterContextValue ? (
          <KakaoClusterContext.Provider value={clusterContextValue}>
            {typeof children === 'function' ? children({ zoom }) : children}
            <KakaoMapClusterOverlays onClusterClick={handleClusterClick} />
          </KakaoClusterContext.Provider>
        ) : (
          typeof children === 'function' ? children({ zoom }) : children
        )}
      </Suspense>
    </KakaoMapContext.Provider>
  );
}
