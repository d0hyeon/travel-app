import { useEffect } from "react";
import { serializeCoordinates } from "../map.utils";
import { KakaoMapContext, useMapContext } from "../MapContext";
import type { PathProps } from "../types";

export default function KakaoMapPath({ coordinates, strokeColor, strokeWeight, strokeOpacity, strokeStyle }: PathProps) {
  const { map, config, extendBound } = useMapContext(KakaoMapContext);


  useEffect(() => {
    if (coordinates.length < 2) return;

    const path = coordinates.map(x => new kakao.maps.LatLng(x.lat, x.lng));
    const polyline = new kakao.maps.Polyline({
      path,
      strokeWeight: strokeWeight ?? 4,
      strokeColor: strokeColor ?? '#1976d2',
      strokeOpacity: strokeOpacity ?? 0.8,
      strokeStyle: strokeStyle ?? 'solid',
    })

    if (config.autoFocus === 'path') {
      coordinates.forEach(coord => extendBound(coord));
    }
    polyline.setMap(map);
    return () => polyline.setMap(null);
  }, [serializeCoordinates(coordinates), strokeWeight, strokeColor, strokeOpacity, strokeStyle, config.autoFocus, extendBound]);

  return null;
}

