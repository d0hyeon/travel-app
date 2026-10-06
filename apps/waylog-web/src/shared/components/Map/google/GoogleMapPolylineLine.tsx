import { useContext, useEffect } from 'react';
import { GoogleMapContext, useMapContext } from '../MapContext';
import { PolylineContext } from '../PolylineContext';
import type { PolylineLineProps } from '../types';
import { createLabelNode, createPositionedOverlay } from './marker.renderers';

const DEFAULT_STROKE_COLOR = '#1976d2';
const DEFAULT_STROKE_WEIGHT = 4;
const DEFAULT_STROKE_OPACITY = 0.8;
// 라벨이 라인 위에 겹치지 않도록 위로 띄운다 (createLabelNode가 margin-top:-offset으로 올림)
const LABEL_OFFSET_PX = 14;
// 폴리라인보다 위에 그려지도록 z-index를 올린다
const LABEL_Z_INDEX = 100;

export default function GoogleMapPolylineLine({ coordinates, label }: PolylineLineProps) {
  const { map, config, extendBound } = useMapContext(GoogleMapContext);
  const style = useContext(PolylineContext);

  useEffect(() => {
    if (coordinates.length < 2) return;

    const strokeColor = style.strokeColor ?? DEFAULT_STROKE_COLOR;
    const strokeWeight = style.strokeWeight ?? DEFAULT_STROKE_WEIGHT;
    const strokeOpacity = style.strokeOpacity ?? DEFAULT_STROKE_OPACITY;

    const polyline = new google.maps.Polyline({
      path: coordinates.map(c => ({ lat: c.lat, lng: c.lng })),
      strokeColor,
      strokeWeight,
      strokeOpacity,
    });

    if (config.autoFocus === 'path') {
      coordinates.forEach(coord => extendBound(coord));
    }

    polyline.setMap(map);

    if (!label) {
      return () => polyline.setMap(null);
    }

    const midIndex = Math.floor(coordinates.length / 2);
    const midCoord = coordinates[midIndex];
    const labelNode = createLabelNode(label, strokeColor, LABEL_OFFSET_PX);
    labelNode.style.zIndex = String(LABEL_Z_INDEX);
    const labelOverlay = createPositionedOverlay({ node: labelNode, position: midCoord, pane: 'overlayLayer' });
    labelOverlay.setMap(map);

    return () => {
      polyline.setMap(null);
      labelOverlay.setMap(null);
    };
  }, [coordinates, label, map, config, extendBound, style]);

  return null;
}
