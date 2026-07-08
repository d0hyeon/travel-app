



import { useCallback, useEffect, useId, useMemo, useRef, type ReactNode } from "react";
import { Link, useLocation, useNavigate, type LinkProps } from "react-router";
import { useOverlay, type OverlayRenderProps as OverlayProps } from "../useOverlay";
import { usePreservedCallback } from "./usePreservedCallback";
import { usePreservedValue } from "./usePreservedValue";
import { useIsMobile } from "../env/useIsMobile";


export interface RouteOverlayRenderProps<Data = never> extends OverlayProps {
  data: Data;
}

export function useRouteOverlay<Data = never>(
  path: string | ((params: Data) => string),
  renderer: (props: RouteOverlayRenderProps<Data>) => ReactNode
) {
  const id = useRouteId()
  const isMobile = useIsMobile();
  const { state, pathname } = useLocation();
  const { routeOverlays = [] } = state ?? {};


  const currentOverlay = routeOverlays.find(x => x.id === id);
  const isOpen = !!currentOverlay;

  const getIsOpen = usePreservedValue(isOpen)

  const overlay = useOverlay();
  const navigate = useNavigate();
  const renderElement = usePreservedCallback(renderer);

  useEffect(() => {
    const handleClose = () => {
      if (getIsOpen()) navigate(-1)
    }
    if (isOpen) {
      overlay.open(
        (props) => renderElement({ ...props, close: handleClose, data: currentOverlay.data })
      )

      return () => {
        // 모바일은 뒤로가기 제스처 모션과 충돌할 수 있어 즉시 unmount 한다.
        if (isMobile) overlay.unmount();
        else overlay.close(); // (close: 상태변경(모션) 후 unmount)
      }
    }
  }, [isOpen, isMobile]);


  const getPath = usePreservedCallback(
    (data: Data) => path instanceof Function ? path(data) : path
  );
  const open = useCallback((data: Data) => {
    const maskPath = getPath(data);
    const state = { routeOverlays: [...routeOverlays, { id, data }] }

    return navigate({ pathname, hash: id }, { mask: maskPath, state })
  }, [routeOverlays, id]);

  const close = useCallback(() => {
    if (isOpen) {
      navigate(-1);
    }
  }, [isOpen])

  return useMemo(() => ({
    isOpen,
    close,
    open,
    Link: (props: Omit<LinkProps, 'to' | 'mask' | 'state'> & { data: Data }) => (
      <Link
        {...props}
        mask={getPath(props.data)}
        to={{ pathname, hash: id }}
        state={{ routeOverlays: [...routeOverlays, { id, data: props.data }] }}
      />
    )
  }), [id, close, open])
}

function useRouteId() {
  const location = useLocation();
  const { pathname, search, mask, hash } = location;

  return useRef(mask != null
    ? `${mask.pathname}?${mask.search.toString()}#${hash}`
    : `${pathname}?${search.toString()}#${hash}`
  ).current
}