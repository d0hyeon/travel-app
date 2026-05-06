import { useCallback, useRef } from 'react';
import { useBatchedCallback } from '~shared/hooks/useBatchedCallback';
import type { Coordinate } from '../types';

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
