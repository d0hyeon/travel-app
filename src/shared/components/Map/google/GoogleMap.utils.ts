import type { MarkerProps } from '../types';

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

