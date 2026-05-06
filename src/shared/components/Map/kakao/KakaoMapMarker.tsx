import { use, useEffect, useEffectEvent, useMemo, useState } from "react";
import { assert } from "~shared/utils/types";
import { KakaoMapContext, useMapContext } from "../MapContext";
import type { MarkerProps } from "../types";
import { createLabelContent, getMarkerImage, getZoomScale, resolveMarkerColor } from "./kakaoMap.utils";
import { KakaoClusterContext } from "./KakaoMap";

export default function KakaoMapMarker(props: MarkerProps) {
  const clusterContext = use(KakaoClusterContext);
  const markerId = useMemo(() => `${props.lat}_${props.lng}`, [props.lat, props.lng]);
  const handleMarkerClick = useEffectEvent(() => props.onClick?.(props));
  const handleMarkerContextMenu = useEffectEvent(() => props.onContextMenu?.(props));

  useEffect(() => {
    if (!clusterContext) return;

    clusterContext.registerMarker({
      ...props,
      id: markerId,
      position: { lat: props.lat, lng: props.lng },
      onClick: handleMarkerClick,
      onContextMenu: handleMarkerContextMenu,
    });

    return () => clusterContext.unregisterMarker(markerId);
  }, [clusterContext, markerId, props.lat, props.lng, props.label, props.variant, props.color, props.opacity, props.outlined, props.thumbnailUrl]);

  if (clusterContext) return null;
  if (props.thumbnailUrl) return <ThumbnailMarker {...props} />;
  return <Marker {...props} />;
}

function ThumbnailMarker({ lat, lng, label, variant, color, thumbnailUrl, onClick = () => { }, onContextMenu }: MarkerProps) {
  const context = useMapContext(KakaoMapContext);
  const position = useMemo(() => new kakao.maps.LatLng(lat, lng), [lat, lng]);
  assert(!!thumbnailUrl, 'ThumbnailMarker requires thumbnailUrl');

  useEffect(() => {

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
  }, [thumbnailUrl, context, position, color]);

  return null;
}


function Marker({ lat, lng, label, tooltip, variant, color, opacity = 1, outlined = false, thumbnailUrl, onClick = () => { }, onContextMenu }: MarkerProps) {
  const context = useMapContext(KakaoMapContext);
  const clusterContext = use(KakaoClusterContext);
  const position = useMemo(() => new kakao.maps.LatLng(lat, lng), [lat, lng]);
  const [zoom, setZoom] = useState<number | undefined>(context.map?.getLevel());

  const shouldRender = !clusterContext;

  useEffect(() => {
    const handler = () => setZoom(context.map.getLevel());

    kakao.maps.event.addListener(context.map, 'zoom_changed', handler)
    return () => {
      kakao.maps.event.removeListener(context.map, 'zoom_changed', handler)
    }
  }, [context.map])

  const marker = useMemo(() => {
    const markerImage = getMarkerImage(variant, color, opacity, zoom, outlined);

    return new kakao.maps.Marker({ position, image: markerImage })
  }, [position, variant, color, opacity, zoom, outlined, thumbnailUrl]);


  const labelOverlay = useMemo(() => {
    if (label == null) return null;
    const scale = getZoomScale(zoom);
    const markerHalfHeight = variant === 'circle' ? 8 * scale : 30 * scale;
    const yAnchor = 1 + (markerHalfHeight + 4) / 20;

    return new kakao.maps.CustomOverlay({
      position,
      content: createLabelContent(label, variant, color, opacity, zoom),
      yAnchor,
    });
  }, [label, variant, color, opacity, zoom]);

  const tooltipOverlay = useMemo(() => {
    if (tooltip == null) return null;
    const scale = getZoomScale(zoom);
    const markerHeight = variant === 'circle' ? 16 * scale : 30 * scale;
    const yAnchor = 1 + markerHeight / 30;

    return new kakao.maps.CustomOverlay({
      position,
      content: createTooltipContent(tooltip, zoom),
      yAnchor,
    });
  }, [tooltip, variant, zoom]);

  useEffect(() => {
    if (!shouldRender) return;
    labelOverlay?.setMap(context.map);
    marker.setMap(context.map);

    const showTooltip = () => tooltipOverlay?.setMap(context.map);
    const hideTooltip = () => tooltipOverlay?.setMap(null);
    if (tooltipOverlay != null) {
      kakao.maps.event.addListener(marker, 'mouseover', showTooltip);
      kakao.maps.event.addListener(marker, 'mouseout', hideTooltip);
    }

    return () => {
      marker.setMap(null);
      labelOverlay?.setMap(null);
      tooltipOverlay?.setMap(null);
      if (tooltipOverlay != null) {
        kakao.maps.event.removeListener(marker, 'mouseover', showTooltip);
        kakao.maps.event.removeListener(marker, 'mouseout', hideTooltip);
      }
    }
  }, [context.map, labelOverlay, marker, shouldRender, tooltipOverlay]);

  useEffect(() => {
    if (context.config.autoFocus !== 'marker' || !shouldRender) return;
    if (context.map == null) return;

    context.extendBound({ lat, lng });
  }, [lat, lng, context.extendBound, shouldRender])


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

function createThumbnailContent(thumbnailUrl: string, color?: MarkerProps['color']): string {
  const borderColor = resolveMarkerColor(color);
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
