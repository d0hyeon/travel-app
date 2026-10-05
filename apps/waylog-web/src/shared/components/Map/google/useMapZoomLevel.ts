import { use, useEffect, useState } from "react";
import { GoogleMapContext } from "../MapContext";

type Options = {
  enabled?: boolean;
}

export function useMapZoomLevel({ enabled = true }: Options = {}) {
  const context = use(GoogleMapContext);
  const [zoom, setZoom] = useState(context?.map?.getZoom() ?? 10);

  useEffect(() => {
    if (!enabled || context?.map == null) return;
    setZoom(context.map.getZoom() ?? 10);
    const zoomListener = context.map.addListener('zoom_changed', () => {
      setZoom(context.map!.getZoom() ?? 10);
    });


    return () => {
      google.maps.event.removeListener(zoomListener);
    };
  }, [enabled, context?.map])
  
  return zoom;
}