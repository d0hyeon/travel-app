import { use, useEffect, useState } from "react";
import { KakaoMapContext } from "../MapContext";
import type { MapBounds } from "../types";

export function useMapViewport() {
  const context = use(KakaoMapContext);
  const map = context?.map ?? null;
  const [bound, setCurrentBounds] = useState<MapBounds | null>(null); 

  useEffect(() => {
    if (!map) return;
    const idleHandler = () => {
      const bounds = map.getBounds();
      if (!bounds) return;
      const next: MapBounds = {
        north: bounds.getNorthEast().getLat(),
        south: bounds.getSouthWest().getLat(),
        east: bounds.getNorthEast().getLng(),
        west: bounds.getSouthWest().getLng(),
      };
      setCurrentBounds(prev =>
        prev?.north === next.north && prev?.south === next.south &&
        prev?.east === next.east && prev?.west === next.west
          ? prev : next
      );
    };
    kakao.maps.event.addListener(map, 'idle', idleHandler);
    return () => kakao.maps.event.removeListener(map, 'idle', idleHandler);
  }, [map])

  return bound;
}