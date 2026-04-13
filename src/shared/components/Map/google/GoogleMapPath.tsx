import { use, useEffect } from "react";
import { GoogleMapContext } from "../MapContext";
import type { PathProps } from "../types";

export default function GooglePath({ coordinates, strokeColor = '#1976d2', strokeWeight = 4, strokeOpacity = 0.8 }: PathProps) {
  const context = use(GoogleMapContext);

  useEffect(() => {
    if (!context?.map || coordinates.length < 2) return;

    const polyline = new google.maps.Polyline({
      path: coordinates.map(c => ({ lat: c.lat, lng: c.lng })),
      strokeColor,
      strokeWeight,
      strokeOpacity,
      map: context.map,
    });

    if (context.config.autoFocus === 'path') {
      coordinates.forEach(coord => context.extendBound(coord));
    }

    return () => polyline.setMap(null);
  }, [context, coordinates, strokeColor, strokeWeight, strokeOpacity]);

  return null;
}