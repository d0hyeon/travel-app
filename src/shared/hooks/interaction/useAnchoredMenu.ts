import { useCallback, useState } from 'react';
import { usePointerPosition } from './usePointerPosition';

/**
 * DOM 앵커가 없는 대상(예: 지도 마커)을 클릭했을 때,
 * 마지막 포인터 위치에 MUI `Menu`를 띄우기 위한 상태/배선을 캡슐화합니다.
 *
 * 좌표·열림 여부·anchor 설정 같은 구현 세부는 감추고,
 * 소비자는 "어떤 대상의 메뉴를 여는가"만 다룹니다.
 *
 * @example
 * const placeMenu = useAnchoredMenu<TripPlace, HTMLDivElement>();
 * <Box onPointerDownCapture={placeMenu.onPointerDownCapture}>
 *   <Marker onClick={() => placeMenu.open(place)} />
 * </Box>
 * <Menu {...placeMenu.menuProps}>
 *   {placeMenu.target && <MenuItem onClick={() => { edit(placeMenu.target!); placeMenu.close() }}>수정</MenuItem>}
 * </Menu>
 */
export function useAnchoredMenu<Target, Container extends HTMLElement = HTMLElement>() {
  const { positionRef, onPointerDownCapture } = usePointerPosition<Container>();
  const [state, setState] = useState<{ target: Target; top: number; left: number } | null>(null);

  const open = useCallback((target: Target) => {
    const position = positionRef.current;
    if (!position) return;
    setState({ target, ...position });
  }, [positionRef]);

  const close = useCallback(() => setState(null), []);

  return {
    /** 메뉴 위치 기준이 되는 컨테이너에 부착한다 */
    onPointerDownCapture,
    /** 마지막 포인터 위치에 대상의 메뉴를 연다 */
    open,
    close,
    /** 현재 메뉴 대상 (닫혀 있으면 null) */
    target: state?.target ?? null,
    /** MUI `Menu` 에 스프레드한다 */
    menuProps: {
      open: state !== null,
      anchorReference: 'anchorPosition' as const,
      anchorPosition: state ? { top: state.top, left: state.left } : undefined,
      onClose: close,
    },
  };
}
