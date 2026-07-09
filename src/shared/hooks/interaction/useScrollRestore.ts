import { createContext, useContext, useEffect } from 'react';
import { useLocation } from 'react-router';
import { useScrollEventListener } from './useScrollEventListener';
import { useIsBFCacheRestored } from '../dom/useIsBFCacheRestored';
import { APP_ROOT_NODE_CLASS } from '~app/constants';

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

const ScrollContainerContext = createContext<HTMLElement | null>(null);

export const ScrollContainerProvider = ScrollContainerContext.Provider;

export function useScrollContainer() {
  const context = useContext(ScrollContainerContext);
  
  if (context == null) {
    return document.querySelector(`.${APP_ROOT_NODE_CLASS}`) as HTMLElement;
  }
  return context ?? null;
}

type RestoreOptions<E extends HTMLElement> = {
  element?: E | null;
  key?: string;
  enabled?: boolean;
}

export function useScrollRestore<E extends HTMLElement>(options: RestoreOptions<E> = {}) {
  const container = useScrollContainer()
  const location = useLocation();
  
  const storageKey = options.key ?? `scroll-restore:${location.key}`;
  const target = objectHasByKey(options, 'element') ? options.element : container;
  
  useScrollEventListener(target, {
    onScrollEnd: (event) => {
      if (event.target instanceof HTMLElement) {
        const value = [event.target.scrollTop, event.target.scrollLeft].join(', ')
        sessionStorage.setItem(storageKey, value);
      }
    },
    enabled: options.enabled
  })

  const isRestoredScroll = useIsBFCacheRestored();
  useEffect(() => {
    if (!target || isRestoredScroll || options.enabled === false) return;
    const saved = sessionStorage.getItem(storageKey);
    if (saved == null) return;

    const [top, left] = saved.split(',').map(Number);
    target.scrollTo({ top, left })
  }, [storageKey, target, options.enabled])
}

function objectHasByKey<T extends object, Key extends keyof T>(obj: T, key: Key): obj is T & Record<Key, Omit<T[Key], 'undefined'>> {
  return Object.hasOwn(obj, key) 
}


