import { useEffect, useState } from "react";
import { GoogleMapContext, useMapContext } from "../MapContext";
import type { MapBounds } from "../types";

export function useMapViewport() {
  const { map } = useMapContext(GoogleMapContext);
  const [bound, setCurrentBounds] = useState<MapBounds | null>(null);

  useEffect(() => {
    const idleListener = map.addListener('idle', () => {
      const bounds = map.getBounds();
      if (!bounds) return;
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      const next = { north: ne.lat(), south: sw.lat(), east: ne.lng(), west: sw.lng() };
      setCurrentBounds(prev =>
        prev?.north === next.north && prev?.south === next.south &&
        prev?.east === next.east && prev?.west === next.west
          ? prev : next
      );
    });

    return () => google.maps.event.removeListener(idleListener);
  }, [map]);

  return bound;
}
