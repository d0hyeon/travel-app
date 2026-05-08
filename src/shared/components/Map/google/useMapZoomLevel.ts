import { useEffect, useState } from "react";
import { GoogleMapContext, useMapContext } from "../MapContext";

export function useMapZoomLevel() {
  const { map } = useMapContext(GoogleMapContext);
  const [zoom, setZoom] = useState(map.getZoom() ?? 10);

  useEffect(() => {
    const zoomListener = map.addListener('zoom_changed', () => {
      setZoom(map.getZoom() ?? 10);
    });


    return () => {
      google.maps.event.removeListener(zoomListener);
    };
  }, [])
  
  return zoom;
}