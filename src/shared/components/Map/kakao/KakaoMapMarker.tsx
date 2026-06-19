import { useEffect, useEffectEvent, useMemo, useState } from "react";
import { assert } from "~shared/utils/types";
import { KakaoMapContext, useMapContext } from "../MapContext";
import type { MarkerProps } from "../types";
import { useRegisterClusterMarker } from "../useClusterRegistry";
import { createLabelContent, createThumbnailMarkerNode, getMarkerImage, getZoomScale } from "./kakaoMap.utils";


export default function KakaoMapMarker(props: MarkerProps) {
  useRegisterClusterMarker({
    ...props,
    position: { lat: props.lat, lng: props.lng },
    onClick: () => props.onClick?.(props),
    onContextMenu: () => props.onContextMenu?.(props),
  })
  const { config, extendBound } = useMapContext(KakaoMapContext);

  useEffect(() => {
    if (config.autoFocus === 'marker') {
      extendBound(props);
    }
  }, [])

  if (config.clustering) {
    return null;
  }

  if (props.thumbnailUrl) {
    return <ThumbnailMarker {...props} />;
  }

  return <Marker {...props} />;
}

function ThumbnailMarker({ lat, lng, label, tooltip, variant, color, thumbnailUrl, onClick = () => { }, onContextMenu }: MarkerProps) {
  const context = useMapContext(KakaoMapContext);
  const position = useMemo(() => new kakao.maps.LatLng(lat, lng), [lat, lng]);
  assert(!!thumbnailUrl, 'ThumbnailMarker requires thumbnailUrl');

  useEffect(() => {
    const { node, destroy } = createThumbnailMarkerNode({
      thumbnailUrl,
      color,
      onClick: () => onClick({ lat, lng, label, variant }),
      onContextMenu: onContextMenu ? () => onContextMenu({ lat, lng, label, variant }) : undefined,
    });

    if (tooltip) {
      const lines = Array.isArray(tooltip) ? tooltip : [tooltip];
      const tooltipEl = document.createElement('div');
      tooltipEl.style.cssText = 'position:absolute; bottom:calc(100% + 28px); left:50%; transform:translateX(-50%); background:white; color:#333; padding:6px 10px; border-radius:8px; font-size:12px; box-shadow:0 2px 8px rgba(0,0,0,0.15); white-space:nowrap; pointer-events:none; display:none;';
      tooltipEl.innerHTML = lines.map(l => `<div>${l}</div>`).join('');
      node.style.position = 'relative';
      node.appendChild(tooltipEl);
      node.addEventListener('mouseenter', () => { tooltipEl.style.display = 'block'; });
      node.addEventListener('mouseleave', () => { tooltipEl.style.display = 'none'; });
    }

    const overlay = new kakao.maps.CustomOverlay({
      position,
      content: node,
      yAnchor: 1.08,
      xAnchor: 0.5,
    });

    overlay.setMap(context.map);

    let labelOverlay: kakao.maps.CustomOverlay | null = null;
    if (label) {
      labelOverlay = new kakao.maps.CustomOverlay({
        position,
        content: createLabelContent(label, variant, color),
        yAnchor: 1 + 56 / 20,
        xAnchor: 0.5,
      });
      labelOverlay.setMap(context.map);
    }

    return () => {
      destroy();
      overlay.setMap(null);
      labelOverlay?.setMap(null);
    };
  }, [thumbnailUrl, context, position, color, label, tooltip, variant]);

  return null;
}


function Marker({ lat, lng, label, tooltip, variant, color, opacity = 1, outlined = false, thumbnailUrl, onClick = () => { }, onContextMenu }: MarkerProps) {
  const context = useMapContext(KakaoMapContext);
  const position = useMemo(() => new kakao.maps.LatLng(lat, lng), [lat, lng]);
  const [zoom, setZoom] = useState<number | undefined>(context.map?.getLevel());

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
  }, [context.map, labelOverlay, marker, tooltipOverlay]);

  useEffect(() => {
    if (context.config.autoFocus !== 'marker') return;
    if (context.map == null) return;

    context.extendBound({ lat, lng });
  }, [lat, lng, context.extendBound])


  const clickHandler = useEffectEvent(() => onClick({ lat, lng, label, variant }));
  const contextMenuHandler = useEffectEvent(() => onContextMenu?.({ lat, lng, label, variant }))

  useEffect(function subscribeEvnet() {
    if (marker != null) {
      kakao.maps.event.addListener(marker, 'click', clickHandler);
      kakao.maps.event.addListener(marker, 'rightclick', contextMenuHandler)

      return () => {
        kakao.maps.event.removeListener(marker, 'click', clickHandler);
        kakao.maps.event.removeListener(marker, 'rightclick', contextMenuHandler)
      }
    }
  }, [marker]);

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

