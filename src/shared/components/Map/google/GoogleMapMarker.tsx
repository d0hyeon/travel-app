import { use, useEffect, useEffectEvent, useMemo } from "react";
import type { MarkerProps } from "../types";
import { GoogleMapContext } from "../MapContext";
import { createThumbnailContent } from "./GoogleMap.utils";


export default function GoogleMarker({
  id,
  lat,
  lng,
  label,
  tooltip,
  variant = 'default',
  color,
  opacity = 1,
  thumbnailUrl,
  onClick,
  onContextMenu,
}: MarkerProps) {
  const context = use(GoogleMapContext);
  const markerId = useMemo(() => id ?? `${lat}_${lng}`, [id, lat, lng]);

  const markerColor = useMemo(() => {
    if (color) return color;
    return { default: '#ef5350', selected: '#1976d2', disabled: '#9e9e9e' }[variant];
  }, [variant, color]);

  const handleClick = useEffectEvent(() => onClick?.({ lat, lng, label, variant }));
  const handleContextMenu = useEffectEvent(() => onContextMenu?.({ lat, lng, label, variant }));

  // 클러스터링 모드: 레지스트리에 등록
  useEffect(() => {
    if (!context?.config.clustering) return;

    context.registerMarker({
      id: markerId,
      position: { lat, lng },
      label,
      tooltip,
      variant,
      color: markerColor,
      opacity,
      thumbnailUrl,
      onClick: handleClick,
      onContextMenu: handleContextMenu,
    });

    return () => context.unregisterMarker(markerId);
  }, [context, markerId, lat, lng, label, variant, markerColor, opacity, thumbnailUrl]);

  const shouldRender = !context?.config.clustering;

  // 일반 마커 (클러스터링 off)
  useEffect(() => {
    if (!shouldRender || !context?.map) return;

    if (thumbnailUrl) {
      // thumbnail은 아래 별도 effect에서 처리
      return;
    }

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 24 36">
        <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24c0-6.6-5.4-12-12-12z" fill="${markerColor}" fill-opacity="${opacity}"/>
        <circle cx="12" cy="11" r="4" fill="white"/>
      </svg>
    `;
    const marker = new google.maps.Marker({
      position: { lat, lng },
      map: context.map,
      title: label,
      icon: {
        url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
        scaledSize: new google.maps.Size(28, 40),
        anchor: new google.maps.Point(14, 40),
      },
      opacity,
    });

    if (context.config.autoFocus === 'marker') context.extendBound({ lat, lng });

    const clickL = marker.addListener('click', handleClick);
    const rmenuL = marker.addListener('rightclick', handleContextMenu);

    return () => {
      google.maps.event.removeListener(clickL);
      google.maps.event.removeListener(rmenuL);
      marker.setMap(null);
    };
  }, [shouldRender, context, lat, lng, markerColor, opacity, thumbnailUrl]);

  // 썸네일 오버레이 (클러스터링 off)
  useEffect(() => {
    if (!shouldRender || !context?.map || !thumbnailUrl) return;

    if (context.config.autoFocus === 'marker') context.extendBound({ lat, lng });

    const el = document.createElement('div');
    el.innerHTML = createThumbnailContent(thumbnailUrl, markerColor);
    el.style.cssText = 'position:absolute; transform:translate(-50%, -100%); cursor:pointer;';
    el.addEventListener('click', handleClick);

    class ThumbnailOverlay extends google.maps.OverlayView {
      onAdd() {
        this.getPanes()?.overlayMouseTarget.appendChild(el);
      }
      draw() {
        const pos = this.getProjection().fromLatLngToDivPixel(new google.maps.LatLng(lat, lng));
        if (pos) {
          el.style.left = `${pos.x}px`;
          el.style.top = `${pos.y - 8}px`;
        }
      }
      onRemove() { el.parentNode?.removeChild(el); }
    }

    const overlay = new ThumbnailOverlay();
    overlay.setMap(context.map);
    return () => overlay.setMap(null);
  }, [shouldRender, context, lat, lng, thumbnailUrl, markerColor]);

  // 라벨 (클러스터링 off, thumbnail 없을 때)
  useEffect(() => {
    if (!shouldRender || !context?.map || !label || thumbnailUrl) return;

    class LabelOverlay extends google.maps.OverlayView {
      private div: HTMLDivElement | null = null;
      onAdd() {
        this.div = document.createElement('div');
        this.div.style.cssText = `position:absolute; background:${markerColor}; color:white; padding:2px 6px; border-radius:10px; font-size:11px; font-weight:bold; white-space:nowrap; pointer-events:none; transform:translate(-50%,-100%); margin-top:-44px;`;
        this.div.textContent = label!;
        this.getPanes()?.overlayLayer.appendChild(this.div);
      }
      draw() {
        if (!this.div) return;
        const pos = this.getProjection().fromLatLngToDivPixel(new google.maps.LatLng(lat, lng));
        if (pos) { this.div.style.left = `${pos.x}px`; this.div.style.top = `${pos.y}px`; }
      }
      onRemove() {
        if (this.div?.parentNode) { this.div.parentNode.removeChild(this.div); this.div = null; }
      }
    }

    const overlay = new LabelOverlay();
    overlay.setMap(context.map);
    return () => overlay.setMap(null);
  }, [shouldRender, context, lat, lng, label, markerColor, thumbnailUrl]);

  return null;
}


