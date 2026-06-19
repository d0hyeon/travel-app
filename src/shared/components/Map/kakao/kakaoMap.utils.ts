import { ZOOM_SCALE_CONFIG } from "../map.constants";
import { resolveMarkerColor } from "../map.utils";
import type { MarkerColor, MarkerProps } from "../types";

export function createTooltipContent(tooltip: string | string[], level: number = 8): string {
  const lines = Array.isArray(tooltip) ? tooltip : [tooltip];
  const content = lines.map(line => `<div>${line}</div>`).join('');
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
        width: 0; height: 0;
        border-left: 6px solid transparent;
        border-right: 6px solid transparent;
        border-top: 6px solid white;
      "></div>
    </div>
  `;
}

export function createThumbnailContent(thumbnailUrl: string, color?: string): string {
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
  `;
}

export function nomalizeBound (bound: kakao.maps.LatLngBounds) {
  const sw = bound.getSouthWest();
  const ne = bound.getNorthEast();

  return {
    north: ne.getLat(),
    south: sw.getLat(),
    east: ne.getLng(),
    west: sw.getLng(),
  }
}

export function createClusterContent(count: number, level: number): string {
  const scale = getZoomScale(level);
  const size = Math.round(40 * scale);
  const fontSize = Math.round(14 * scale);
  return `
    <div style="
      width: ${size}px;
      height: ${size}px;
      background: #1976d2;
      border: 3px solid white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: ${fontSize}px;
      font-weight: bold;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    ">${count}</div>
  `;
}

export { resolveMarkerColor };

export function createLabelContent(
  label: string,
  variant?: MarkerProps['variant'],
  color?: MarkerColor,
  opacity = 1,
  level: number = 8
): string {
  const bg = resolveMarkerColor(color, variant);
  const scale = getZoomScale(level);
  const fontSize = Math.round(11 * scale);
  const paddingV = Math.round(2 * scale);
  const paddingH = Math.round(6 * scale);

  return `
    <div style="
      background: ${bg};
      color: white;
      padding: ${paddingV}px ${paddingH}px;
      border-radius: 10px;
      font-size: ${fontSize}px;
      font-weight: bold;
      white-space: nowrap;
      opacity: ${opacity};
    ">${label}</div>
  `
}

export function getZoomScale(level: number = 8): number {
  const { BASE_LEVEL, MIN_SCALE, MAX_SCALE, RATE } = ZOOM_SCALE_CONFIG;
  const scale = 1 + (BASE_LEVEL - level) * RATE;
  return Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale));
}

export function getMarkerImage(
  variant?: MarkerProps['variant'],
  color?: MarkerColor,
  opacity = 1,
  level: number = 8,
  outlined = false,
): kakao.maps.MarkerImage | undefined {
  const scale = getZoomScale(level);
  const resolvedColor = resolveMarkerColor(color, variant);

  if (variant === 'circle') {
    const size = 20 * scale;
    const svgCircle = outlined ? `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 16 16">
      <circle cx="8" cy="8" r="6" fill="white" fill-opacity="0.9" stroke="${resolvedColor}" stroke-width="2.5" stroke-opacity="${opacity}"/>
    </svg>
    ` : `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 16 16">
      <circle cx="8" cy="8" r="6" fill="${resolvedColor}" fill-opacity="${opacity}" stroke="white" stroke-width="4.5"/>
      <circle cx="8" cy="8" r="6" fill="none" stroke="${resolvedColor}" fill-opacity="${opacity}" stroke-width="1" />
    </svg>
    `;
    
    const encodedSvg = encodeURIComponent(svgCircle);
    const dataUrl = `data:image/svg+xml,${encodedSvg}`;
    return new kakao.maps.MarkerImage(
      dataUrl,
      new kakao.maps.Size(size, size),
      { offset: new kakao.maps.Point(size / 2, size / 2) }
    );
  }

  const svgMarker = `
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="30" viewBox="0 0 20 30">
      <path fill="${resolvedColor}" fill-opacity="${opacity}" d="M10 0C4.5 0 0 4.5 0 10c0 7.5 10 20 10 20s10-12.5 10-20c0-5.5-4.5-10-10-10z"/>
      <circle fill="white" fill-opacity="${opacity}" cx="10" cy="10" r="4"/>
    </svg>
  `;
  const encodedSvg = encodeURIComponent(svgMarker);
  const dataUrl = `data:image/svg+xml,${encodedSvg}`;

  return new kakao.maps.MarkerImage(
    dataUrl,
    new kakao.maps.Size(20 * scale, 30 * scale),
    { offset: new kakao.maps.Point(10 * scale, 30 * scale) }
  );
}

// ── DOM 조립 (인터랙티브 노드) ──────────────────────────

export interface MarkerElement {
  node: HTMLElement;
  destroy: () => void;
}

interface ThumbnailMarkerNodeParams {
  thumbnailUrl: string;
  color?: MarkerColor;
  onClick?: () => void;
  onContextMenu?: () => void;
}

/**
 * 썸네일 콘텐츠를 클릭/컨텍스트메뉴가 바인딩된 DOM 노드로 만들고 정리 핸들을 반환한다.
 * overlay 마운트(CustomOverlay)는 호출부의 책임이다.
 */
export function createThumbnailMarkerNode({ thumbnailUrl, color, onClick, onContextMenu }: ThumbnailMarkerNodeParams): MarkerElement {
  const node = document.createElement('div');
  node.innerHTML = createThumbnailContent(thumbnailUrl, color);
  node.style.cursor = 'pointer';

  const cleanups: Array<() => void> = [];
  if (onClick) {
    node.addEventListener('click', onClick);
    cleanups.push(() => node.removeEventListener('click', onClick));
  }
  if (onContextMenu) {
    node.addEventListener('contextmenu', onContextMenu);
    cleanups.push(() => node.removeEventListener('contextmenu', onContextMenu));
  }

  return { node, destroy: () => cleanups.forEach(cleanup => cleanup()) };
}
