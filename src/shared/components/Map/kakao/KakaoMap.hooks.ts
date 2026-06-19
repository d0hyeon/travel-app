import { useCallback, useEffect, useEffectEvent, useMemo, useRef } from "react";
import type { Coordinate, MapBounds } from "../types";
import { useBatchedCallback } from "~shared/hooks/useBatchedCallback";

/** @package { KakaoMap.tsx } */
export function useBoundsChangeListener(map: kakao.maps.Map | null, onChangeBounds?: (bounds: MapBounds) => void) {
  const callback = useEffectEvent((bounds: MapBounds) => onChangeBounds?.(bounds));
  const hasCallback = onChangeBounds != null;

  useEffect(() => {
    if (!map || !hasCallback) return;
    const handler = () => {
      const bounds = map.getBounds();
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      callback({ north: ne.getLat(), south: sw.getLat(), east: ne.getLng(), west: sw.getLng() });
    };

    kakao.maps.event.addListener(map, 'bounds_changed', handler);
    return () => kakao.maps.event.removeListener(map, 'bounds_changed', handler);
  }, [map, hasCallback]);
}

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
