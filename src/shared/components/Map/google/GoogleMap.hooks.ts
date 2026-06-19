import { useCallback, useEffect, useEffectEvent, useRef } from "react";
import type { Coordinate, MapBounds } from "../types";
import { useBatchedCallback } from "~shared/hooks/useBatchedCallback";

/** @package {GoogleMap.tsx} */
export function useBoundsChangeListener(map: google.maps.Map | null, onChangeBound?: (bound: MapBounds) => void) {
  const callback = useEffectEvent((bounds: MapBounds) => onChangeBound?.(bounds));
  const hasCallback = onChangeBound != null;

  useEffect(() => {
    if (map == null || !hasCallback) return;
    const listener = map.addListener('bounds_changed', () => {
      const bounds = map.getBounds();
      if (!bounds) return;
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      callback({ north: ne.lat(), south: sw.lat(), east: ne.lng(), west: sw.lng() });
    });

    return () => google.maps.event.removeListener(listener);
  }, [map, hasCallback])
}

/** @package {GoogleMap.tsx} */
export function useViewportFit(map: google.maps.Map | null) {
  const boundsRef = useRef<google.maps.LatLngBounds | null>(null);

  const fit = useCallback(() => {
    if (!map || !boundsRef.current) return;
    map.fitBounds(boundsRef.current);
  }, [map]);

  const extend = useBatchedCallback<Coordinate>((coords) => {
    if (!map) return;
    const bounds = new google.maps.LatLngBounds();
    coords.forEach(c => bounds.extend({ lat: c.lat, lng: c.lng }));
    boundsRef.current = bounds;
    map.fitBounds(bounds);
  }, { once: true });

  return { boundsRef, extend, fit };
}
