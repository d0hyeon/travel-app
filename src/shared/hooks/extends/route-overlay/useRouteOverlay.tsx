import { useCallback, useMemo, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate, type LinkProps } from "react-router";
import { usePreservedCallback } from "../usePreservedCallback";
import { registerRouteOverlay, type RouteOverlayRenderProps } from "./routeOverlayStore";

export type { RouteOverlayRenderProps };

interface RouteOverlayEntry {
  id: string;
  data: unknown;
}

export function useRouteOverlay<Data = never>(
  path: string | ((params: Data) => string),
  renderer: (props: RouteOverlayRenderProps<Data>) => ReactNode
) {
  const id = useRouteId();
  const { pathname, state } = useLocation();
  const { routeOverlays = [] } = (state ?? {}) as { routeOverlays?: RouteOverlayEntry[] };

  const isOpen = routeOverlays.some((entry) => entry.id === id);

  // 렌더 주체는 root의 RouteOverlayRenderer. 여기서는 renderer 등록만 한다.
  // 등록해두면 이 훅을 소유한 컴포넌트가 언마운트된 뒤에도 복원이 가능하다.
  registerRouteOverlay<Data>(id, renderer);

  const getPath = usePreservedCallback(
    (data: Data) => (path instanceof Function ? path(data) : path)
  );

  const navigate = useNavigate();

  const open = useCallback((data: Data) => {
    const maskPath = getPath(data);
    const nextState = { routeOverlays: [...routeOverlays, { id, data }] };
    return navigate({ pathname, hash: id }, { mask: maskPath, state: nextState });
  }, [routeOverlays, id]);

  const close = useCallback(() => {
    if (isOpen) navigate(-1);
  }, [isOpen]);

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
  }), [id, close, open]);
}

function useRouteId() {
  const { pathname, search, mask, hash } = useLocation();

  // 최초 렌더의 location 기준으로 id를 고정한다. 오버레이가 열린 뒤
  // 히스토리 이동이 있어도 이 오버레이의 식별자는 바뀌지 않아야 한다.
  const [id] = useState(() => mask != null
    ? `${mask.pathname}?${mask.search.toString()}#${hash}`
    : `${pathname}?${search.toString()}#${hash}`
  );

  return id;
}
