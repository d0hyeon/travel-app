import { use, useEffect, useEffectEvent, useMemo } from "react";
import type { MarkerProps } from "../types";
import { GoogleMapContext } from "../MapContext";
import { resolveMarkerColor } from "../map.utils";
import { createThumbnailContent } from "./GoogleMap.utils";


export default function GoogleMarker({
  id,
  lat,
  lng,
  label,
  tooltip,
  variant = 'pin',
  color,
  opacity = 1,
  outlined = false,
  thumbnailUrl,
  onClick,
  onContextMenu,
}: MarkerProps) {
  const context = use(GoogleMapContext);
  const markerId = useMemo(() => id ?? `${lat}_${lng}`, [id, lat, lng]);

  const markerColor = useMemo(() => resolveMarkerColor(color, variant), [color, variant]);

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
      outlined,
      thumbnailUrl,
      onClick: handleClick,
      onContextMenu: handleContextMenu,
    });

    return () => context.unregisterMarker(markerId);
  }, [context, markerId, lat, lng, label, variant, markerColor, opacity, outlined, thumbnailUrl]);

  const shouldRender = !context?.config.clustering;

  // 일반 마커 (클러스터링 off)
  useEffect(() => {
    if (!shouldRender || !context?.map) return;

    if (thumbnailUrl) {
      // thumbnail은 아래 별도 effect에서 처리
      return;
    }

    if (context.config.autoFocus === 'marker') context.extendBound({ lat, lng });

    if (variant === 'circle') {
      const svg = outlined ? `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
          <circle cx="8" cy="8" r="6" fill="white" fill-opacity="0.9" stroke="${markerColor}" stroke-width="2.5"/>
        </svg>
      ` : `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
          <circle cx="8" cy="8" r="6" fill="${markerColor}" fill-opacity="${opacity}" stroke="white" stroke-width="4.5"/>
          <circle cx="8" cy="8" r="6" fill="none" stroke="${markerColor}" fill-opacity="${opacity}" stroke-width="1" />
        </svg>
      `;
      const marker = new google.maps.Marker({
        position: { lat, lng },
        map: context.map,
        title: label,
        icon: {
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
          scaledSize: new google.maps.Size(20, 20),
          anchor: new google.maps.Point(8, 8),
        },
        opacity,
      });

      const clickL = marker.addListener('click', handleClick);
      const rmenuL = marker.addListener('rightclick', handleContextMenu);

      return () => {
        google.maps.event.removeListener(clickL);
        google.maps.event.removeListener(rmenuL);
        marker.setMap(null);
      };
    }

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="34" viewBox="0 0 20 30">
        <path d="M10 0C4.5 0 0 4.5 0 10c0 7.5 10 20 10 20s10-12.5 10-20c0-5.5-4.5-10-10-10z" fill="${markerColor}" fill-opacity="${opacity}"/>
        <circle cx="10" cy="10" r="4" fill="white"/>
      </svg>
    `;
    const marker = new google.maps.Marker({
      position: { lat, lng },
      map: context.map,
      title: label,
      icon: {
        url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
        scaledSize: new google.maps.Size(24, 34),
        anchor: new google.maps.Point(12, 34),
      },
      opacity,
    });

    const clickL = marker.addListener('click', handleClick);
    const rmenuL = marker.addListener('rightclick', handleContextMenu);

    return () => {
      google.maps.event.removeListener(clickL);
      google.maps.event.removeListener(rmenuL);
      marker.setMap(null);
    };
  }, [shouldRender, context, lat, lng, variant, markerColor, opacity, outlined, thumbnailUrl]);

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

    const markerOffsetPx = variant === 'circle' ? 20 : 38;

    class LabelOverlay extends google.maps.OverlayView {
      private div: HTMLDivElement | null = null;
      onAdd() {
        this.div = document.createElement('div');
        this.div.style.cssText = `position:absolute; background:${markerColor}; color:white; padding:2px 6px; border-radius:10px; font-size:11px; font-weight:bold; white-space:nowrap; pointer-events:none; transform:translate(-50%,-100%); margin-top:-${markerOffsetPx}px;`;
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
  }, [shouldRender, context, lat, lng, variant, label, markerColor, thumbnailUrl]);

  return null;
}
