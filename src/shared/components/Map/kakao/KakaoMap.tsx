import { Box, type BoxProps } from '@mui/material';
import { Suspense, use, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { KakaoMapContext } from '../MapContext';
import type { MapProps } from '../types';
import { ClusterProvider } from '../useClusterRegistry';
import { KakaoMapClusterOverlays } from './cluster/KakaoMapClusterOverlays';
import { useBoundsChangeListener, useViewportFit } from './KakaoMap.hooks';
import { loadKakaoMap } from './loader';
import { useMapZoomLevel } from './useMapZoomLevel';


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
  // map은 state여야 한다. ref로 두면 인스턴스 생성이 리렌더를 트리거하지 않아
  // 컨텍스트로 전파되지 않고, 모바일 사파리 등에서 첫 마운트 시 마커가 표시되지 않는다.
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

  useBoundsChangeListener(map, onBoundsChange);

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

