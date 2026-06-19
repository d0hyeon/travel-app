import { useEffect, useEffectEvent, useMemo } from "react";
import type { MarkerProps } from "../types";
import { GoogleMapContext, useMapContext } from "../MapContext";
import { resolveMarkerColor } from "../map.utils";
import { createMarkerSvg, createThumbnailContent } from "./GoogleMap.utils";
import { useRegisterClusterMarker } from "../useClusterRegistry";

export default function GoogleMapMarker(props: MarkerProps) {
  const { config, extendBound } = useMapContext(GoogleMapContext);

  const markerColor = useMemo(() => resolveMarkerColor(props.color, props.variant), [props.color, props.variant]);
  const handleClick = useEffectEvent(() => props.onClick?.({ lat: props.lat, lng: props.lng, label: props.label, variant: props.variant }));
  const handleContextMenu = useEffectEvent(() => props.onContextMenu?.({ lat: props.lat, lng: props.lng, label: props.label, variant: props.variant }));

  useRegisterClusterMarker({
    ...props,
    position: { lat: props.lat, lng: props.lng },
    color: markerColor,
    onClick: handleClick,
    onContextMenu: handleContextMenu,
  })

  useEffect(() => {
    if (config.autoFocus === 'marker') {
      extendBound({ lat: props.lat, lng: props.lng });
    }
  }, [])


  if (config.clustering) return null;
  if (props.thumbnailUrl) return <ThumbnailMarker {...props} />;
  return <Marker {...props} />;
}

// ── ThumbnailMarker ────────────────────────────────────

function ThumbnailMarker({ lat, lng, label, tooltip, variant, color, thumbnailUrl, onClick }: MarkerProps) {
  const { map, extendBound, config } = useMapContext(GoogleMapContext);
  const markerColor = useMemo(() => resolveMarkerColor(color, variant), [color, variant]);

  const handleClick = useEffectEvent(() => onClick?.({ lat, lng, label, variant }));

  useEffect(() => {
    if (config.autoFocus === 'marker') extendBound({ lat, lng });

    const el = document.createElement('div');
    el.innerHTML = createThumbnailContent(thumbnailUrl!, markerColor);
    el.style.cssText = 'position:absolute; transform:translate(-50%, -100%); cursor:pointer;';
    el.addEventListener('click', handleClick);

    let tooltipEl: HTMLDivElement | null = null;
    if (tooltip) {
      const lines = Array.isArray(tooltip) ? tooltip : [tooltip];
      tooltipEl = document.createElement('div');
      tooltipEl.style.cssText = 'position:absolute; bottom:calc(100% + 28px); left:50%; transform:translateX(-50%); background:white; color:#333; padding:6px 10px; border-radius:8px; font-size:12px; box-shadow:0 2px 8px rgba(0,0,0,0.15); white-space:nowrap; pointer-events:none; display:none;';
      tooltipEl.innerHTML = lines.map(l => `<div>${l}</div>`).join('');
      el.appendChild(tooltipEl);
      el.addEventListener('mouseenter', () => { if (tooltipEl) tooltipEl.style.display = 'block'; });
      el.addEventListener('mouseleave', () => { if (tooltipEl) tooltipEl.style.display = 'none'; });
    }

    class ThumbnailOverlay extends google.maps.OverlayView {
      onAdd() { this.getPanes()?.overlayMouseTarget.appendChild(el); }
      draw() {
        const pos = this.getProjection().fromLatLngToDivPixel(new google.maps.LatLng(lat, lng));
        if (pos) { el.style.left = `${pos.x}px`; el.style.top = `${pos.y - 8}px`; }
      }
      onRemove() { el.parentNode?.removeChild(el); }
    }

    const overlay = new ThumbnailOverlay();
    overlay.setMap(map);

    const cleanupLabel = label ? mountLabelOverlay({ map, lat, lng, label, markerColor, offsetPx: 56 }) : null;

    return () => {
      el.removeEventListener('click', handleClick);
      overlay.setMap(null);
      cleanupLabel?.();
    };
  }, [map, lat, lng, thumbnailUrl, markerColor, label, tooltip, variant]);

  return null;
}

// ── Marker ─────────────────────────────────────────────

function Marker({ lat, lng, label, tooltip, variant = 'pin', color, opacity = 1, outlined = false, onClick, onContextMenu }: MarkerProps) {
  const { map, extendBound, config } = useMapContext(GoogleMapContext);
  const markerColor = useMemo(() => resolveMarkerColor(color, variant), [color, variant]);

  const handleClick = useEffectEvent(() => onClick?.({ lat, lng, label, variant }));
  const handleContextMenu = useEffectEvent(() => onContextMenu?.({ lat, lng, label, variant }));

  useEffect(() => {
    if (config.autoFocus === 'marker') extendBound({ lat, lng });

    const svg = createMarkerSvg(variant, markerColor, opacity, outlined);
    const isCircle = variant === 'circle';
    const marker = new google.maps.Marker({
      position: { lat, lng },
      map,
      title: label,
      icon: isCircle
        ? { url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`, scaledSize: new google.maps.Size(20, 20), anchor: new google.maps.Point(8, 8) }
        : { url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`, scaledSize: new google.maps.Size(24, 34), anchor: new google.maps.Point(12, 34) },
      opacity,
    });
    const clickL = marker.addListener('click', handleClick);
    const rmenuL = marker.addListener('rightclick', handleContextMenu);

    const cleanupLabel = label ? mountLabelOverlay({ map, lat, lng, label, markerColor, offsetPx: isCircle ? 20 : 38 }) : null;
    const cleanupTooltip = tooltip ? mountTooltipOverlay({ map, lat, lng, marker, tooltip }) : null;

    return () => {
      google.maps.event.removeListener(clickL);
      google.maps.event.removeListener(rmenuL);
      marker.setMap(null);
      cleanupLabel?.();
      cleanupTooltip?.();
    };
  }, [map, lat, lng, variant, markerColor, opacity, outlined, label, tooltip]);

  return null;
}

// ── 내부 마운트 함수 ────────────────────────────────────

function mountLabelOverlay({ map, lat, lng, label, markerColor, offsetPx }: {
  map: google.maps.Map;
  lat: number; lng: number;
  label: string;
  markerColor: string;
  offsetPx: number;
}): () => void {
  class LabelOverlay extends google.maps.OverlayView {
    private div: HTMLDivElement | null = null;
    onAdd() {
      this.div = document.createElement('div');
      this.div.style.cssText = `position:absolute; background:${markerColor}; color:white; padding:2px 6px; border-radius:10px; font-size:11px; font-weight:bold; white-space:nowrap; pointer-events:none; transform:translate(-50%,-100%); margin-top:-${offsetPx}px;`;
      this.div.textContent = label;
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
  overlay.setMap(map);
  return () => overlay.setMap(null);
}

function mountTooltipOverlay({ map, lat, lng, marker, tooltip }: {
  map: google.maps.Map;
  lat: number; lng: number;
  marker: google.maps.Marker;
  tooltip: string | string[];
}): () => void {
  const lines = Array.isArray(tooltip) ? tooltip : [tooltip];
  const content = lines.map(l => `<div>${l}</div>`).join('');

  class TooltipOverlay extends google.maps.OverlayView {
    private div: HTMLDivElement | null = null;
    onAdd() {
      this.div = document.createElement('div');
      this.div.style.cssText = 'position:absolute; background:white; color:#333; padding:6px 10px; border-radius:8px; font-size:12px; box-shadow:0 2px 8px rgba(0,0,0,0.15); white-space:nowrap; pointer-events:none; transform:translate(-50%,-100%); margin-top:-44px;';
      this.div.innerHTML = content;
      this.div.style.display = 'none';
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
    show() { if (this.div) this.div.style.display = 'block'; }
    hide() { if (this.div) this.div.style.display = 'none'; }
  }

  const overlay = new TooltipOverlay();
  overlay.setMap(map);
  const show = () => overlay.show();
  const hide = () => overlay.hide();
  marker.addListener('mouseover', show);
  marker.addListener('mouseout', hide);

  return () => {
    overlay.setMap(null);
    google.maps.event.clearListeners(marker, 'mouseover');
    google.maps.event.clearListeners(marker, 'mouseout');
  };
}
