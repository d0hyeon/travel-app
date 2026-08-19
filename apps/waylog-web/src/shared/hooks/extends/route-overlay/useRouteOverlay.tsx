import { useCallback, useId, useMemo, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate, type LinkProps } from "react-router";
import { usePreservedCallback } from "../usePreservedCallback";
import { registerRouteOverlay, type RouteOverlayRenderProps } from "./routeOverlayStore";

export type { RouteOverlayRenderProps };

interface RouteOverlayEntry {
  id: string;
  templateId: string;
  data: unknown;
}

interface RouteOverlayState {
  routeOverlays?: RouteOverlayEntry[];
}

export function useRouteOverlay<Data = never>(
  path: string | ((params: Data) => string),
  renderer: (props: RouteOverlayRenderProps<Data>) => ReactNode
) {
  // templateId는 이 훅 호출 지점(오버레이 종류)의 식별자다. 렌더 간 안정적이고,
  // store에 남아 있어 호출 컴포넌트가 언마운트된 뒤에도 복원에 쓰인다.
  const templateId = useId();
  const { pathname, state, search } = useLocation();
  const { routeOverlays = [] }: RouteOverlayState = state ?? {};

  // renderer를 안정 참조로 고정해 매 렌더 재등록/통지(렌더 폭풍)를 막는다.
  const renderElement = usePreservedCallback(renderer);
  registerRouteOverlay<Data>(templateId, renderElement);

  const getPath = usePreservedCallback(
    (data: Data) => (path instanceof Function ? path(data) : path)
  );
  const navigate = useNavigate();

  // 열린 오버레이 인스턴스를 구분하는 유니크 엔트리 id. 같은 templateId를 여러 번 열어도
  // 서로 다른 id를 가지므로 스택/렌더 key 충돌이 없다.
  const openWith = usePreservedCallback((entryId: string, data: Data) => {
    const entry: RouteOverlayEntry = { id: entryId, templateId, data };
    return navigate(
      { pathname, hash: entryId, search: search.toString() },
      { mask: getPath(data), state: { routeOverlays: [...routeOverlays, entry] } }
    );
  });

  const open = useCallback((data: Data) => {
    return openWith(crypto.randomUUID(), data);
  }, [openWith]);

  return useMemo(() => ({
    open,
    Link: (props: Omit<LinkProps, 'to' | 'mask' | 'state'> & { data: Data }) => (
      <RouteOverlayLink
        {...props}
        pathname={pathname}
        search={search.toString()}
        entry={{ templateId, data: props.data }}
        routeOverlays={routeOverlays}
        mask={getPath(props.data)}
      />
    )
  }), [open, templateId, pathname, search, routeOverlays, getPath]);
}

interface RouteOverlayLinkProps extends Omit<LinkProps, 'to' | 'mask' | 'state'> {
  pathname: string;
  search: string;
  entry: { templateId: string; data: unknown };
  routeOverlays: RouteOverlayEntry[];
  mask: string;
}

function RouteOverlayLink({ pathname, search, entry, routeOverlays, mask, ...linkProps }: RouteOverlayLinkProps) {
  // 각 Link 인스턴스는 자신의 엔트리 id를 한 번만 생성해 렌더 간 고정한다.
  const [entryId] = useState(() => crypto.randomUUID());
  const nextEntry: RouteOverlayEntry = { id: entryId, ...entry };

  return (
    <Link
      {...linkProps}
      mask={mask}
      to={{ pathname, hash: entryId, search }}
      state={{ routeOverlays: [...routeOverlays, nextEntry] }}
    />
  );
}
