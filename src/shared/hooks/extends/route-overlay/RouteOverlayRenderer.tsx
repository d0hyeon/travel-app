import { useEffect, useSyncExternalStore } from "react";
import { useLocation, useNavigate } from "react-router";
import { useIsMobile } from "~shared/hooks/env/useIsMobile";
import { useOverlay } from "~shared/hooks/useOverlay";
import { getRouteOverlay, subscribeRouteOverlay } from "./routeOverlayStore";

interface RouteOverlayEntry {
  id: string;
  kind: string;
  data: unknown;
}

/**
 * root에 상주하며 열려 있는 라우트 오버레이 스택을 렌더한다.
 * 오버레이를 연 컴포넌트가 언마운트되어도 이 렌더러는 살아있으므로,
 * 라우트 전환 후 뒤로가기로 돌아오면 히스토리 state와 store만으로 복원한다.
 */
export function RouteOverlayRenderer() {
  const { state } = useLocation();
  const { routeOverlays = [] } = (state ?? {}) as { routeOverlays?: RouteOverlayEntry[] };

  return (
    <>
      {routeOverlays.map((entry) => (
        <RouteOverlaySlot key={entry.id} kind={entry.kind} data={entry.data} />
      ))}
    </>
  );
}

function RouteOverlaySlot({ kind, data }: Pick<RouteOverlayEntry, 'kind' | 'data'>) {
  const overlay = useOverlay();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // 복원 직후 renderer가 아직 등록되지 않았을 수 있으므로 store를 구독한다.
  // renderer는 kind당 안정 참조로 등록되므로 이 구독은 폭풍을 일으키지 않는다.
  const renderer = useSyncExternalStore(subscribeRouteOverlay, () => getRouteOverlay(kind));

  useEffect(() => {
    if (!renderer) return;

    const goBack = () => navigate(-1);
    overlay.open((props) => renderer({ ...props, close: goBack, data }));

    return () => {
      // 모바일은 뒤로가기 제스처 모션과 충돌할 수 있어 즉시 unmount 한다.
      if (isMobile) overlay.unmount();
      else overlay.close(); // (close: 상태변경(모션) 후 unmount)
    };
    // 슬롯은 key={id}로 격리되어 data/navigate/overlay는 이 슬롯 생명주기 동안 고정이다.
    // renderer(늦은 등록)와 isMobile 변경 시에만 재마운트한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renderer, isMobile]);

  return null;
}
