import { useEffect } from "react";
import { GoogleMapContext, useMapContext } from "../MapContext";
import type { PathProps } from "../types";

export default function GooglePath({ coordinates, strokeColor = '#1976d2', strokeWeight = 4, strokeOpacity = 0.8 }: PathProps) {
  const context = useMapContext(GoogleMapContext);
  useEffect(() => {
    if (coordinates.length < 2) return;

    const polyline = new google.maps.Polyline({
      path: coordinates.map(c => ({ lat: c.lat, lng: c.lng })),
      strokeColor,
      strokeWeight,
      strokeOpacity,
    });

    if (context.config.autoFocus === 'path') {
      coordinates.forEach(coord => context.extendBound(coord));
    }

    polyline.setMap(context.map)
    return () => polyline.setMap(null);
  }, [context, coordinates, strokeColor, strokeWeight, strokeOpacity]);

  return null;
}