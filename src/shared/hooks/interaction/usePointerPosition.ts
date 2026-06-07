import { useCallback, useRef, type PointerEvent } from 'react';

export interface PointerPosition {
  top: number;
  left: number;
}

/**
 * 마지막 포인터(터치/마우스) 위치를 화면 좌표로 기억합니다.
 *
 * DOM 앵커를 얻을 수 없는 대상(예: 지도 마커) 위에서
 * `anchorPosition` 기반 메뉴/팝오버를 띄울 때 사용합니다.
 *
 * @example
 * const { positionRef, onPointerDownCapture } = usePointerPosition();
 * <Box onPointerDownCapture={onPointerDownCapture}>...</Box>
 * // 이후 positionRef.current 로 마지막 좌표 참조
 */
export function usePointerPosition<Target extends HTMLElement = HTMLElement>() {
  const positionRef = useRef<PointerPosition | null>(null);

  const onPointerDownCapture = useCallback((event: PointerEvent<Target>) => {
    positionRef.current = { top: event.clientY, left: event.clientX };
  }, []);

  return { positionRef, onPointerDownCapture };
}
