import { useEffect } from "react";
import { KakaoMapContext, useMapContext } from "../MapContext";
import type { PathProps } from "../types";

export default function KakaoMapPath({ coordinates, strokeColor, strokeWeight, strokeOpacity, strokeStyle }: PathProps) {
  const { map, config, extendBound } = useMapContext(KakaoMapContext);
  const path = coordinates.map(x => new kakao.maps.LatLng(x.lat, x.lng));

  useEffect(() => {
    const polyline = new kakao.maps.Polyline({
      path,
      strokeWeight: strokeWeight ?? 4,
      strokeColor: strokeColor ?? '#1976d2',
      strokeOpacity: strokeOpacity ?? 0.8,
      strokeStyle: strokeStyle ?? 'solid',
    })
    polyline.setMap(map);
    if (config.autoFocus === 'path') {
      path.forEach((position) => {
        extendBound({ lat: position.getLat(), lng: position.getLng() })
      });
    }
    return () => polyline.setMap(null);
  }, [path, config.autoFocus, extendBound]);

  return null;
}