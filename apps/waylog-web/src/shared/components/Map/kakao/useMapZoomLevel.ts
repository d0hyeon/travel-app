import { use, useEffect, useState } from "react";
import { KakaoMapContext } from "../MapContext";
import { kakaoLevelToZoom } from "./zoomLevel.utils";

type Options = {
  enabled?: boolean;
}

export function useMapZoomLevel({ enabled = true }: Options = {}) {
  const context = use(KakaoMapContext);
  const [level, setLevel] = useState(context?.map?.getLevel() ?? 8);

  useEffect(() => {
    if (!enabled || context?.map == null) return;

    setLevel(context.map.getLevel());
    const zoomHandler = () => setLevel(context.map!.getLevel());
    kakao.maps.event.addListener(context.map, 'zoom_changed', zoomHandler);

    return () => {
      kakao.maps.event.removeListener(context.map!, 'zoom_changed', zoomHandler);
    };
  }, [enabled, context?.map])

  return kakaoLevelToZoom(level);
}
