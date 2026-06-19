import { ZOOM_SCALE_CONFIG } from "../map.constants";
import { resolveMarkerColor } from "../map.utils";
import type { MarkerColor, MarkerData, MarkerProps } from "../types";


type MarkerRenderData = Omit<MarkerData, 'id'>;

/** 마커 데이터를 지도에 그리고 정리 함수를 반환한다. 썸네일/일반/라벨/툴팁 분기를 여기서 결정한다. */
export function renderMarker(md: MarkerRenderData, map: kakao.maps.Map, zoom: number): VoidFunction {
  const position = new kakao.maps.LatLng(md.position.lat, md.position.lng);

  if (md.thumbnailUrl) return renderThumbnailMarker(md, map, position);
  return renderDefaultMarker(md, map, zoom, position);
}

function renderThumbnailMarker(md: MarkerRenderData, map: kakao.maps.Map, position: kakao.maps.LatLng): VoidFunction {
  const { node, destroy } = createThumbnailMarkerNode({
    thumbnailUrl: md.thumbnailUrl!,
    color: md.color,
    onClick: md.onClick,
    onContextMenu: md.onContextMenu,
  });

  const overlay = new kakao.maps.CustomOverlay({ position, content: node, yAnchor: 1.08, xAnchor: 0.5 });
  overlay.setMap(map);

  const labelOverlay = md.label
    ? new kakao.maps.CustomOverlay({
      position,
      content: createLabelContent(md.label, md.variant, md.color),
      yAnchor: 1 + 56 / 20,
      xAnchor: 0.5,
    })
    : null;
  labelOverlay?.setMap(map);

  return () => {
    destroy();
    overlay.setMap(null);
    labelOverlay?.setMap(null);
  };
}

function renderDefaultMarker(md: MarkerRenderData, map: kakao.maps.Map, zoom: number, position: kakao.maps.LatLng): VoidFunction {
  const cleanups: VoidFunction[] = [];

  const marker = new kakao.maps.Marker({
    position,
    image: getMarkerImage(md.variant, md.color, md.opacity, zoom, md.outlined),
  });
  marker.setMap(map);
  cleanups.push(() => marker.setMap(null));

  if (md.onClick) {
    const onClick = md.onClick;
    kakao.maps.event.addListener(marker, 'click', onClick);
    cleanups.push(() => kakao.maps.event.removeListener(marker, 'click', onClick));
  }
  if (md.onContextMenu) {
    const onContextMenu = md.onContextMenu;
    kakao.maps.event.addListener(marker, 'rightclick', onContextMenu);
    cleanups.push(() => kakao.maps.event.removeListener(marker, 'rightclick', onContextMenu));
  }

  if (md.label) {
    const scale = getZoomScale(zoom);
    const markerHalfHeight = md.variant === 'circle' ? 8 * scale : 30 * scale;
    const labelOverlay = new kakao.maps.CustomOverlay({
      position,
      content: createLabelContent(md.label, md.variant, md.color, md.opacity, zoom),
      yAnchor: 1 + (markerHalfHeight + 4) / 20,
    });
    labelOverlay.setMap(map);
    cleanups.push(() => labelOverlay.setMap(null));
  }

  if (md.tooltip != null) {
    const scale = getZoomScale(zoom);
    const markerHeight = md.variant === 'circle' ? 16 * scale : 30 * scale;
    const tooltipOverlay = new kakao.maps.CustomOverlay({
      position,
      content: createTooltipContent(md.tooltip, zoom),
      yAnchor: 1 + markerHeight / 30,
    });
    const showTooltip = () => tooltipOverlay.setMap(map);
    const hideTooltip = () => tooltipOverlay.setMap(null);
    kakao.maps.event.addListener(marker, 'mouseover', showTooltip);
    kakao.maps.event.addListener(marker, 'mouseout', hideTooltip);
    cleanups.push(() => {
      tooltipOverlay.setMap(null);
      kakao.maps.event.removeListener(marker, 'mouseover', showTooltip);
      kakao.maps.event.removeListener(marker, 'mouseout', hideTooltip);
    });
  }

  return () => cleanups.forEach(cleanup => cleanup());
}

function createTooltipContent(tooltip: string | string[], level: number = 8): string {
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
  `;
}



function createLabelContent(
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

function getMarkerImage(
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

interface MarkerElement {
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
function createThumbnailMarkerNode({ thumbnailUrl, color, onClick, onContextMenu }: ThumbnailMarkerNodeParams): MarkerElement {
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


