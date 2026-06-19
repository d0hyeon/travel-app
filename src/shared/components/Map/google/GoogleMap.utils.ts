import type { Coordinate, MarkerProps } from '../types';

// ── 콘텐츠 생성 (렌더링용 문자열) ───────────────────────

export function createThumbnailContent(thumbnailUrl: string, color: string): string {
  return `
    <div style="display:flex; flex-direction:column; align-items:center; filter:drop-shadow(0 3px 8px rgba(0,0,0,0.25));">
      <div style="width:48px; height:48px; border-radius:50%; border:3px solid ${color}; overflow:hidden; background:#eee;">
        <img src="${thumbnailUrl}" style="width:100%;height:100%;object-fit:cover;" />
      </div>
      <div style="width:0; height:0; border-left:5px solid transparent; border-right:5px solid transparent; border-top:6px solid ${color}; margin-top:-1px;"></div>
    </div>
  `;
}

export function createMarkerSvg(variant: MarkerProps['variant'], color: string, opacity: number, outlined: boolean): string {
  if (variant === 'circle') {
    return outlined
      ? `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="white" fill-opacity="0.9" stroke="${color}" stroke-width="2.5"/></svg>`
      : `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="${color}" fill-opacity="${opacity}" stroke="white" stroke-width="4.5"/><circle cx="8" cy="8" r="6" fill="none" stroke="${color}" fill-opacity="${opacity}" stroke-width="1"/></svg>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="34" viewBox="0 0 20 30"><path d="M10 0C4.5 0 0 4.5 0 10c0 7.5 10 20 10 20s10-12.5 10-20c0-5.5-4.5-10-10-10z" fill="${color}" fill-opacity="${opacity}"/><circle cx="10" cy="10" r="4" fill="white"/></svg>`;
}

// ── DOM 조립 (인터랙티브 노드) ──────────────────────────

export interface MarkerElement {
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
export function createThumbnailMarkerNode({ thumbnailUrl, color, onClick, onContextMenu }: ThumbnailMarkerNodeParams): MarkerElement {
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
export function createLabelNode(label: string, markerColor: string, offsetPx: number): HTMLElement {
  const node = document.createElement('div');
  node.style.cssText = `position:absolute; background:${markerColor}; color:white; padding:2px 6px; border-radius:10px; font-size:11px; font-weight:bold; white-space:nowrap; pointer-events:none; transform:translate(-50%,-100%); margin-top:-${offsetPx}px;`;
  node.textContent = label;
  return node;
}

/** 마커 툴팁 DOM 노드를 만든다. 초기 상태는 숨김이며, 표시 토글은 호출부의 책임이다. */
export function createTooltipNode(tooltip: string | string[]): HTMLElement {
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

