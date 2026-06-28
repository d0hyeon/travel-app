import { useEffect } from "react";
import { KakaoMapContext, useMapContext } from "../MapContext";
import type { MarkerData, MarkerProps } from "../types";
import { useRegisterClusterMarker } from "../useClusterRegistry";
import { renderMarker } from "./marker.renderers";
import { useMapZoomLevel } from "./useMapZoomLevel";
import { omit } from '~shared/utils/common';

function toMarkerData(props: MarkerProps): Omit<MarkerData, 'id'> {
  return {
    ...props,
    position: { lat: props.lat, lng: props.lng },
    onClick: () => props.onClick?.(props),
    onContextMenu: () => props.onContextMenu?.(props),
  };
}

export default function KakaoMapMarker(props: MarkerProps) {
  const { config, map, extendBound } = useMapContext(KakaoMapContext);
  const zoom = useMapZoomLevel();
  const markerData = toMarkerData(props);

  useRegisterClusterMarker(markerData, [config.clustering]);

  const renderDependencies = Object.values(omit(props, ['onClick', 'onContextMenu', 'tooltip']))
  const tooltip = Array.isArray(props.tooltip) ? props.tooltip.join() : props.tooltip;

  useEffect(() => {
    if (config.clustering || map == null) return;
    return renderMarker(markerData, map, zoom);
  }, [config.clustering, tooltip, zoom, ...renderDependencies]);

  useEffect(() => {
    if (config.autoFocus === 'marker') {
      extendBound(props);
    }
  }, []);

  return null;
}
