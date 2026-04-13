import { use, useEffect } from "react";
import { KakaoMapContext } from "../MapContext";
import type { PathProps } from "../types";

export default function KakaoMapPath({ coordinates, strokeColor, strokeWeight, strokeOpacity, strokeStyle }: PathProps) {
  const context = use(KakaoMapContext);
  const path = coordinates.map(x => new kakao.maps.LatLng(x.lat, x.lng));

  useEffect(() => {
    if (context?.map == null) return;

    const polyline = new kakao.maps.Polyline({
      path,
      strokeWeight: strokeWeight ?? 4,
      strokeColor: strokeColor ?? '#1976d2',
      strokeOpacity: strokeOpacity ?? 0.8,
      strokeStyle: strokeStyle ?? 'solid',
    })
    polyline.setMap(context.map);
    if (context.config.autoFocus === 'path') {
      path.forEach((position) => {
        context.extendBound({ lat: position.getLat(), lng: position.getLng() })
      });
    }
    return () => polyline.setMap(null);
  }, [path, context])

  return null;
}