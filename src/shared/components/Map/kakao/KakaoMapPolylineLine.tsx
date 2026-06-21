import { use, useEffect } from 'react';
import { serializeCoordinates } from '../map.utils';
import { KakaoMapContext, useMapContext } from '../MapContext';
import { PolylineContext } from '../PolylineContext';
import type { PolylineLineProps } from '../types';
import { createLabelContent } from './marker.renderers';

export default function KakaoMapPolylineLine({ coordinates, label }: PolylineLineProps) {
  const { map, config, extendBound } = useMapContext(KakaoMapContext);
  const { strokeColor, strokeWeight, strokeOpacity, strokeStyle } = use(PolylineContext);

  useEffect(() => {
    if (coordinates.length < 2) return;

    const path = coordinates.map(c => new kakao.maps.LatLng(c.lat, c.lng));
    const polyline = new kakao.maps.Polyline({
      path,
      strokeWeight: strokeWeight ?? 4,
      strokeColor: strokeColor ?? '#1976d2',
      strokeOpacity: strokeOpacity ?? 0.8,
      strokeStyle: strokeStyle ?? 'solid',
    });

    if (config.autoFocus === 'path') {
      coordinates.forEach(coord => extendBound(coord));
    }
    polyline.setMap(map);

    const midCoord = coordinates[Math.floor(coordinates.length / 2)];
    const labelOverlay = label
      ? new kakao.maps.CustomOverlay({
        position: new kakao.maps.LatLng(midCoord.lat, midCoord.lng),
        content: createLabelContent(label, undefined, strokeColor),
        // 라벨이 라인 위에 겹치지 않도록 위로 더 띄운다
        yAnchor: 1,
        xAnchor: 1,
        // 폴리라인보다 위에 그려지도록 z-index를 올린다
        zIndex: 100,
      })
      : null;
    labelOverlay?.setMap(map);

    return () => {
      polyline.setMap(null);
      labelOverlay?.setMap(null);
    };
  }, [serializeCoordinates(coordinates), config.autoFocus, extendBound]);

  return null;
}
