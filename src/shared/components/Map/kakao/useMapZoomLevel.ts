import { use, useEffect, useState } from "react";
import { KakaoMapContext } from "../MapContext";


type Options = {
  enabled?: boolean;
}

export function useMapZoomLevel({ enabled = true }: Options = {}) {
  const context = use(KakaoMapContext);
  const [zoom, setZoom] = useState(context?.map?.getLevel() ?? 8);
  
  useEffect(() => {
    if (!enabled || context?.map == null) return;
    
    setZoom(context.map.getLevel());
    const zoomHandler = () => setZoom(context.map!.getLevel());
    kakao.maps.event.addListener(context.map, 'zoom_changed', zoomHandler);

    return () => {
      kakao.maps.event.removeListener(context.map!, 'zoom_changed', zoomHandler);
    };
  }, [enabled, context?.map])

  return zoom;
}
