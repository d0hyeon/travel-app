import { use, useEffect, useEffectEvent, useMemo, useState } from "react";
import { KakaoMapContext } from "../MapContext";
import type { MarkerProps } from "../types";
import { createLabelContent, getMarkerImage, getZoomScale } from "./kakaoMap.utils";

export default function KakaoMapMarker({ id, lat, lng, label, tooltip, variant, color, opacity = 1, thumbnailUrl, onClick = () => { }, onContextMenu }: MarkerProps) {
  const context = use(KakaoMapContext);
  const markerId = useMemo(() => id ?? `${lat}_${lng}`, [id, lat, lng]);
  const position = useMemo(() => new kakao.maps.LatLng(lat, lng), [lat, lng]);
  const [zoom, setZoom] = useState<number | undefined>(context?.map?.getLevel());

  const handleMarkerClick = useEffectEvent(() => onClick({ lat, lng, label, variant }));
  const handleMarkerContextMenu = useEffectEvent(() => onContextMenu?.({ lat, lng, label, variant }));

  useEffect(() => {
    if (!context?.config.clustering) return;

    context.registerMarker({
      id: markerId,
      position: { lat, lng },
      label,
      tooltip,
      variant,
      color,
      opacity,
      thumbnailUrl,
      onClick: handleMarkerClick,
      onContextMenu: handleMarkerContextMenu,
    });

    return () => context.unregisterMarker(markerId);
  }, [context, markerId, lat, lng, label, variant, color, opacity, thumbnailUrl]);

  const shouldRender = useMemo(() => {
    if (!context?.config.clustering) return true;
    return false;
  }, [context?.config.clustering]);

  useEffect(() => {
    if (context?.map == null) return;
    const handler = () => {
      setZoom(context.map?.getLevel())
    }

    kakao.maps.event.addListener(context.map, 'zoom_changed', handler)
    return () => {
      if (context.map) {
        kakao.maps.event.removeListener(context.map, 'zoom_changed', handler)
      }
    }
  }, [context?.map])

  const marker = useMemo(() => {
    if (thumbnailUrl) return null; // thumbnail은 CustomOverlay로 렌더링
    const markerImage = getMarkerImage(variant, color, opacity, zoom);

    return new kakao.maps.Marker({
      position,
      image: markerImage,
    })
  }, [position, variant, color, zoom, thumbnailUrl]);

  useEffect(function renderLabel() {
    if (context?.map == null || label == null || !shouldRender || thumbnailUrl) return;

    const { map } = context;
    const scale = getZoomScale(zoom);
    const yAnchor = 1 + (36 * scale + 4) / 20;
    const overlay = new kakao.maps.CustomOverlay({
      position,
      content: createLabelContent(label, variant, color, opacity, zoom),
      yAnchor,
    });

    overlay.setMap(map);
    return () => overlay.setMap(null);
  }, [context, label, color, opacity, zoom, shouldRender, thumbnailUrl]);

  useEffect(function renderMarker() {
    if (marker == null || context?.map == null || !shouldRender) return;
    marker.setMap(context.map);

    if (context.config.autoFocus === 'marker') {
      context.extendBound({ lat: position.getLat(), lng: position.getLng() });
    }
    return () => marker.setMap(null);
  }, [marker, position, context, shouldRender])

  useEffect(function renderThumbnailOverlay() {
    if (!thumbnailUrl || context?.map == null || !shouldRender) return;

    if (context.config.autoFocus === 'marker') {
      context.extendBound({ lat: position.getLat(), lng: position.getLng() });
    }

    const el = document.createElement('div');
    el.innerHTML = createThumbnailContent(thumbnailUrl, color);
    el.style.cursor = 'pointer';
    el.addEventListener('click', () => onClick({ lat, lng, label, variant }));
    if (onContextMenu) {
      el.addEventListener('contextmenu', () => onContextMenu({ lat, lng, label, variant }));
    }

    const overlay = new kakao.maps.CustomOverlay({
      position,
      content: el,
      yAnchor: 1.08,
      xAnchor: 0.5,
    });

    overlay.setMap(context.map);
    return () => overlay.setMap(null);
  }, [thumbnailUrl, context, position, color, shouldRender]);

  const clickHandler = useEffectEvent(() => onClick({ lat, lng, label, variant }));
  const contextMenuHandler = useEffectEvent(() => onContextMenu?.({ lat, lng, label, variant }))

  useEffect(function subscribeEvnet() {
    if (marker != null && shouldRender) {
      kakao.maps.event.addListener(marker, 'click', clickHandler);
      kakao.maps.event.addListener(marker, 'rightclick', contextMenuHandler)

      return () => {
        kakao.maps.event.removeListener(marker, 'click', clickHandler);
        kakao.maps.event.removeListener(marker, 'rightclick', contextMenuHandler)
      }
    }
  }, [marker, shouldRender]);

  useEffect(function renderTooltip() {
    if (context?.map == null || marker == null || tooltip == null || !shouldRender) return;

    const { map } = context;
    const scale = getZoomScale(zoom);
    const yAnchor = 1 + (36 * scale) / 30;
    const overlay = new kakao.maps.CustomOverlay({
      position,
      content: createTooltipContent(tooltip, zoom),
      yAnchor,
    });

    const showTooltip = () => overlay.setMap(map);
    const hideTooltip = () => overlay.setMap(null);

    kakao.maps.event.addListener(marker, 'mouseover', showTooltip);
    kakao.maps.event.addListener(marker, 'mouseout', hideTooltip);

    return () => {
      overlay.setMap(null);
      kakao.maps.event.removeListener(marker, 'mouseover', showTooltip);
      kakao.maps.event.removeListener(marker, 'mouseout', hideTooltip);
    };
  }, [context, marker, position, tooltip, zoom, shouldRender]);

  return null;
}






function createTooltipContent(tooltip: string | string[], level: number = 8): string {
  const lines = Array.isArray(tooltip) ? tooltip : [tooltip]
  const content = lines.map(line => `<div>${line}</div>`).join('')
  const scale = getZoomScale(level);
  const fontSize = Math.round(12 * scale);
  const paddingV = Math.round(8 * scale);
  const paddingH = Math.round(12 * scale);

  return `
    <div style="
      position: relative;
      background: white;
      color: #333;
      padding: ${paddingV}px ${paddingH}px;
      border-radius: 8px;
      font-size: ${fontSize}px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      white-space: nowrap;
      pointer-events: none;
    ">
      ${content}
      <div style="
        position: absolute;
        bottom: -6px;
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 0;
        border-left: 6px solid transparent;
        border-right: 6px solid transparent;
        border-top: 6px solid white;
      "></div>
    </div>
  `
}

function createThumbnailContent(thumbnailUrl: string, color?: string): string {
  const borderColor = color ?? '#ef5350';
  return `
    <div style="
      display: flex;
      flex-direction: column;
      align-items: center;
      filter: drop-shadow(0 3px 8px rgba(0,0,0,0.25));
    ">
      <div style="
        width: 48px;
        height: 48px;
        border-radius: 50%;
        border: 3px solid ${borderColor};
        overflow: hidden;
        background: #eee;
      ">
        <img src="${thumbnailUrl}" style="width:100%;height:100%;object-fit:cover;" />
      </div>
      <div style="
        width: 0; height: 0;
        border-left: 5px solid transparent;
        border-right: 5px solid transparent;
        border-top: 6px solid ${borderColor};
        margin-top: -1px;
      "></div>
    </div>
  `
}
