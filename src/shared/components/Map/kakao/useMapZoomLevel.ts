import { useEffect, useState } from "react";
import { KakaoMapContext, useMapContext } from "../MapContext";



export function useMapZoomLevel() {
  const { map } = useMapContext(KakaoMapContext);
  const [zoom, setZoom] = useState(map.getLevel());
  
  useEffect(() => {
    const zoomHandler = () => setZoom(map.getLevel());
    kakao.maps.event.addListener(map, 'zoom_changed', zoomHandler);

    return () => {
      kakao.maps.event.removeListener(map, 'zoom_changed', zoomHandler);
    };
  }, [])

  return zoom;
}
