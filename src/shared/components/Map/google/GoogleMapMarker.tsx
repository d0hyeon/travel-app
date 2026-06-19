import { useEffect } from "react";
import { omit } from "~shared/utils/common";
import { GoogleMapContext, useMapContext } from "../MapContext";
import { resolveMarkerColor } from "../map.utils";
import type { MarkerData, MarkerProps } from "../types";
import { useRegisterClusterMarker } from "../useClusterRegistry";
import { renderMarker } from "./marker.renderers";

function toMarkerData(props: MarkerProps): Omit<MarkerData, 'id'> {
  return {
    ...props,
    position: { lat: props.lat, lng: props.lng },
    color: resolveMarkerColor(props.color, props.variant),
    onClick: () => props.onClick?.(props),
    onContextMenu: () => props.onContextMenu?.(props),
  };
}

export default function GoogleMapMarker(props: MarkerProps) {
  const { config, map, extendBound } = useMapContext(GoogleMapContext);
  const markerData = toMarkerData(props);

  useRegisterClusterMarker(markerData, [config.clustering]);

  const renderDependencies = Object.values(omit(props, ['onClick', 'onContextMenu']));
  useEffect(() => {
    if (config.clustering || map == null) return;
    return renderMarker(markerData, map);
  }, [config.clustering, map, ...renderDependencies]);

  useEffect(() => {
    if (config.autoFocus === 'marker') {
      extendBound({ lat: props.lat, lng: props.lng });
    }
  }, []);

  return null;
}
