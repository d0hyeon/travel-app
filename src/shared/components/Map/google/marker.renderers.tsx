import type { Coordinate, MarkerData, MarkerProps } from '../types';


type MarkerRenderData = Omit<MarkerData, 'id'>;

/** 마커 데이터를 지도에 그리고 정리 함수를 반환한다. 썸네일/일반/라벨/툴팁 분기를 여기서 결정한다. */
export function renderMarker(md: MarkerRenderData, map: google.maps.Map): VoidFunction {
  if (md.thumbnailUrl) return renderThumbnailMarker(md, map);
  return renderDefaultMarker(md, map);
}



function renderThumbnailMarker(md: MarkerRenderData, map: google.maps.Map): VoidFunction {
  const { node, destroy } = createThumbnailMarkerNode({
    thumbnailUrl: md.thumbnailUrl!,
    color: md.color ?? '#ef5350',
    onClick: md.onClick,
    onContextMenu: md.onContextMenu,
  });
  const overlay = createPositionedOverlay({ node, position: md.position, pane: 'overlayMouseTarget', offsetY: -8 });
  overlay.setMap(map);

  return () => {
    destroy();
    overlay.setMap(null);
  };
}

function renderDefaultMarker(md: MarkerRenderData, map: google.maps.Map): VoidFunction {
  const cleanups: VoidFunction[] = [];

  const markerColor = md.color ?? '#ef5350';
  const markerOpacity = md.opacity ?? 1;
  const isCircle = md.variant === 'circle';
  const svg = createMarkerSvg(md.variant, markerColor, markerOpacity, md.outlined ?? false);

  const tooltipText = Array.isArray(md.tooltip) ? md.tooltip.join('\n') : md.tooltip;
  const marker = new google.maps.Marker({
    position: { lat: md.position.lat, lng: md.position.lng },
    map,
    title: tooltipText,
    icon: isCircle
      ? { url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`, scaledSize: new google.maps.Size(20, 20), anchor: new google.maps.Point(8, 8) }
      : { url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`, scaledSize: new google.maps.Size(24, 34), anchor: new google.maps.Point(12, 34) },
    opacity: markerOpacity,
  });
  cleanups.push(() => marker.setMap(null));

  if (md.onClick) {
    const { remove } = marker.addListener('click', md.onClick);
    cleanups.push(remove);
  }
  if (md.onContextMenu) {
    const { remove } = marker.addListener('rightclick', md.onContextMenu);
    cleanups.push(remove);
  }

  if (md.label) {
    const labelNode = createLabelNode(md.label, markerColor, isCircle ? 20 : 38);
    const labelOverlay = createPositionedOverlay({ node: labelNode, position: md.position, pane: 'overlayLayer' });
    labelOverlay.setMap(map);
    cleanups.push(() => labelOverlay.setMap(null));
  }

  if (md.tooltip != null) {
    const tooltipNode = createTooltipNode(md.tooltip);
    const overlay = createPositionedOverlay({ node: tooltipNode, position: md.position, pane: 'overlayLayer' });
    overlay.setMap(map);
    const show = () => { tooltipNode.style.display = 'block'; };
    const hide = () => { tooltipNode.style.display = 'none'; };
    const showL = marker.addListener('mouseover', show);
    const hideL = marker.addListener('mouseout', hide);
    cleanups.push(() => {
      overlay.setMap(null);
      showL.remove();
      hideL.remove();
    });
  }

  return () => cleanups.forEach(cleanup => cleanup());
}


function createThumbnailContent(thumbnailUrl: string, color: string): string {
  return `
    <div style="display:flex; flex-direction:column; align-items:center; filter:drop-shadow(0 3px 8px rgba(0,0,0,0.25));">
      <div style="width:48px; height:48px; border-radius:50%; border:3px solid ${color}; overflow:hidden; background:#eee;">
        <img src="${thumbnailUrl}" style="width:100%;height:100%;object-fit:cover;" />
      </div>
      <div style="width:0; height:0; border-left:5px solid transparent; border-right:5px solid transparent; border-top:6px solid ${color}; margin-top:-1px;"></div>
    </div>
  `;
}

function createMarkerSvg(variant: MarkerProps['variant'], color: string, opacity: number, outlined: boolean): string {
  if (variant === 'circle') {
    return outlined
      ? `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="white" fill-opacity="0.9" stroke="${color}" stroke-width="2.5"/></svg>`
      : `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="${color}" fill-opacity="${opacity}" stroke="white" stroke-width="4.5"/><circle cx="8" cy="8" r="6" fill="none" stroke="${color}" fill-opacity="${opacity}" stroke-width="1"/></svg>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="34" viewBox="0 0 20 30"><path d="M10 0C4.5 0 0 4.5 0 10c0 7.5 10 20 10 20s10-12.5 10-20c0-5.5-4.5-10-10-10z" fill="${color}" fill-opacity="${opacity}"/><circle cx="10" cy="10" r="4" fill="white"/></svg>`;
}

// ── DOM 조립 (인터랙티브 노드) ──────────────────────────

interface MarkerElement {
  node: HTMLElement;
  destroy: () => void;
}

interface ThumbnailMarkerNodeParams {
  thumbnailUrl: string;
  color: string;
  onClick?: () => void;
  onContextMenu?: () => void;
}

/**
 * 썸네일 콘텐츠를 클릭/컨텍스트메뉴가 바인딩된 DOM 노드로 만들고 정리 핸들을 반환한다.
 * overlay 마운트(OverlayView)는 호출부의 책임이다.
 */
function createThumbnailMarkerNode({ thumbnailUrl, color, onClick, onContextMenu }: ThumbnailMarkerNodeParams): MarkerElement {
  const node = document.createElement('div');
  node.innerHTML = createThumbnailContent(thumbnailUrl, color);
  node.style.cssText = 'position:absolute; transform:translate(-50%, -100%); cursor:pointer;';

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

/** 마커 라벨 칩 DOM 노드를 만든다. offsetPx만큼 마커 위로 띄운다. */
function createLabelNode(label: string, markerColor: string, offsetPx: number): HTMLElement {
  const node = document.createElement('div');
  node.style.cssText = `position:absolute; background:${markerColor}; color:white; padding:2px 6px; border-radius:10px; font-size:11px; font-weight:bold; white-space:nowrap; pointer-events:none; transform:translate(-50%,-100%); margin-top:-${offsetPx}px;`;
  node.textContent = label;
  return node;
}

/** 마커 툴팁 DOM 노드를 만든다. 초기 상태는 숨김이며, 표시 토글은 호출부의 책임이다. */
function createTooltipNode(tooltip: string | string[]): HTMLElement {
  const lines = Array.isArray(tooltip) ? tooltip : [tooltip];
  const node = document.createElement('div');
  node.style.cssText = 'position:absolute; background:white; color:#333; padding:6px 10px; border-radius:8px; font-size:12px; box-shadow:0 2px 8px rgba(0,0,0,0.15); white-space:nowrap; pointer-events:none; transform:translate(-50%,-100%); margin-top:-44px; display:none;';
  node.innerHTML = lines.map(line => `<div>${line}</div>`).join('');
  return node;
}

// ── 오버레이 마운트 (좌표 고정) ─────────────────────────

interface PositionedOverlayParams {
  node: HTMLElement;
  position: Coordinate;
  /** 클릭 가능한 노드는 overlayMouseTarget, 표시 전용은 overlayLayer */
  pane: 'overlayLayer' | 'overlayMouseTarget';
  offsetY?: number;
}

/**
 * node를 지정한 좌표에 고정하고 지도 이동 시 위치를 따라가게 하는 OverlayView를 만든다.
 * google 전역이 로드된 뒤(호출 시점)에 클래스를 정의하므로 모듈 최상단 선언을 피한다.
 */
export function createPositionedOverlay({ node, position, pane, offsetY = 0 }: PositionedOverlayParams): google.maps.OverlayView {
  class PositionedOverlay extends google.maps.OverlayView {
    onAdd() {
      this.getPanes()?.[pane].appendChild(node);
    }
    draw() {
      const point = this.getProjection().fromLatLngToDivPixel(new google.maps.LatLng(position.lat, position.lng));
      if (point) {
        node.style.left = `${point.x}px`;
        node.style.top = `${point.y + offsetY}px`;
      }
    }
    onRemove() {
      node.parentNode?.removeChild(node);
    }
  }
  return new PositionedOverlay();
}
