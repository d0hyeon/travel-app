



import { useCallback, useEffect, useId, useMemo, type ReactNode } from "react";
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
  const id = useId()
  const isMobile = useIsMobile();
  const { state, pathname } = useLocation();
  const { routeOverlayActivedIds = [], data } = state ?? {};

  const isOpen = routeOverlayActivedIds.includes(id);
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
        (props) => renderElement({ ...props, close: handleClose, data })
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
    const state = { data, routeOverlayActivedIds: [...routeOverlayActivedIds, id] }

    return navigate({ pathname, hash: id }, { mask: maskPath, state })
  }, [routeOverlayActivedIds, id]);

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
        state={{ data: props.data, routeOverlayActivedIds: [...routeOverlayActivedIds, id] }}
      />
    )
  }), [id, close, open])
}