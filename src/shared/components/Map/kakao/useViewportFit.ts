import { useCallback, useMemo, useRef } from 'react';
import { useBatchedCallback } from '~shared/hooks/useBatchedCallback';
import type { Coordinate } from '../types';

export function useViewportFit(map: kakao.maps.Map | null) {
  const boundsRef = useRef(new kakao.maps.LatLngBounds());

  const fit = useCallback(() => {
    if (!map) return;
    const level = map.getLevel();
    map.panTo(boundsRef.current);
    map.setLevel(level);
  }, [map]);

  const extend = useBatchedCallback<Coordinate>((coords) => {
    if (!map) return;

    const bounds = new kakao.maps.LatLngBounds();
    coords.forEach(c => bounds.extend(new kakao.maps.LatLng(c.lat, c.lng)));
    boundsRef.current = bounds;
    map.setBounds(bounds);
  }, { once: true });

  return useMemo(() => ({ boundsRef, extend, fit }), [extend, fit]);
}
