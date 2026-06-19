



import { useCallback, useEffect, useId, useMemo, type ReactNode } from "react";
import { Link, useLocation, useNavigate, type LinkProps } from "react-router";
import { useOverlay, type OverlayRenderProps as OverlayProps } from "../useOverlay";
import { usePreservedCallback } from "./usePreservedCallback";


export interface RouteOverlayRenderProps<Data = never> extends OverlayProps {
  data: Data;
}

export function useRouteOverlay<Data = never>(
  path: string | ((params: Data) => string),
  renderer: (props: RouteOverlayRenderProps<Data>) => ReactNode
) {
  const id = useId()
  const { state, pathname } = useLocation();
  const { routeOverlayIds = [], data } = state ?? {};

  const isOpen = routeOverlayIds.includes(id);
  const overlay = useOverlay();

  const renderElement = usePreservedCallback(renderer);
  useEffect(() => {
    if (routeOverlayIds.includes(id)) {
      overlay.open(({ close, ...props }) => renderElement({
        ...props,
        close: () => navigate(-1),
        data
      }))
      return () => overlay.close()
    }
  }, [isOpen]);

  const navigate = useNavigate();
  const getPath = usePreservedCallback(
    (data: Data) => path instanceof Function ? path(data) : path
  );
  const open = useCallback((data: Data) => {
    const path = getPath(data);

    return navigate(
      { pathname, hash: id },
      { mask: path, state: { data, routeOverlayIds: [...routeOverlayIds, id] } }
    )
  }, [routeOverlayIds, id]);

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
        state={{ data: props.data, routeOverlayIds: [...routeOverlayIds, id] }}
      />
    )
  }), [id, close, open])
}