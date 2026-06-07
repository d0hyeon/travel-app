import { useCallback, useRef, type PointerEvent } from 'react';

export interface PointerPosition {
  top: number;
  left: number;
}

/**
 * 마지막 포인터(터치/마우스) 위치를 화면 좌표로 추적합니다.
 *
 * DOM 앵커를 얻을 수 없는 대상(예: 지도 마커) 위에서
 * `anchorPosition` 기반 메뉴/팝오버를 띄울 때 사용합니다.
 *
 * 저장 방식(ref)이나 추적에 쓰는 이벤트는 드러내지 않고,
 * "컨테이너에 연결한다(`containerProps`)"와 "마지막 위치를 읽는다(`getPosition`)"만 노출합니다.
 *
 * @example
 * const { containerProps, getPosition } = usePointerPosition<HTMLDivElement>();
 * <Box {...containerProps}>...</Box>
 * // 이후 getPosition() 으로 마지막 좌표 참조
 */
export function usePointerPosition<Container extends HTMLElement = HTMLElement>() {
  const positionRef = useRef<PointerPosition | null>(null);

  const handlePointerDownCapture = useCallback((event: PointerEvent<Container>) => {
    positionRef.current = { top: event.clientY, left: event.clientX };
  }, []);

  /** 추적할 컨테이너에 스프레드한다 */
  const containerProps = { onPointerDownCapture: handlePointerDownCapture };

  /** 마지막 포인터 위치를 반환한다 (입력이 없으면 null) */
  const getPosition = useCallback(() => positionRef.current, []);

  return { containerProps, getPosition };
}
