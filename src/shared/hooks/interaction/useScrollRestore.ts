import { useEffect } from 'react'
import { useLocation } from 'react-router'
import { useScrollEventListener } from './useScrollEventListener';
import { createContext, useContext, type RefObject } from 'react'

/**
 * 커스텀 스크롤 컨테이너의 스크롤 위치를 복원한다.
 *
 * React Router의 <ScrollRestoration />은 window 스크롤만 추적하므로,
 * overflow: auto 컨테이너처럼 window가 아닌 요소에서 스크롤이 일어날 때 사용한다.
 *
 * 반드시 데이터가 resolved된 페이지 컴포넌트에서 호출해야 한다.
 * 레이아웃에서 호출하면 Suspense로 인해 컨텐츠 높이가 확보되기 전에 scrollTop이 세팅돼 복원이 동작하지 않는다.
 *
 * - location.key 기준으로 sessionStorage에 위치를 저장/복원한다.
 * - mount 시 복원, unmount 시 저장한다.
 */

const ScrollContainerContext = createContext<RefObject<HTMLElement | null> | null>(null);

export const ScrollContainerProvider = ScrollContainerContext.Provider;

function useScrollContainer() {
  const context = useContext(ScrollContainerContext);
  if (context == null && document.scrollingElement instanceof HTMLElement) {
    return document.scrollingElement;
  }

  return context?.current ?? null;
}



export function useScrollRestore(key?: string) {
  const container = useScrollContainer()
  const location = useLocation();

  const storageKey = key ?? `scroll-restore:${location.key}`;
  useScrollEventListener(container, {
    onScrollEnd: (event) => {
      if (event.target instanceof HTMLElement) {
        sessionStorage.setItem(storageKey, event.target.scrollTop.toString());
      }
    }
  })

  useEffect(() => {
    if (!container) return;

    const saved = sessionStorage.getItem(storageKey);
    if (saved == null) return;

    container.scrollTop = Number(saved);
  }, [storageKey, container])
}



