import { useEffect } from 'react';

/**
 * 뒤로가기(POP) 네비게이션에서 React Router가 시작하는 view transition을 건너뛴다.
 *
 * 모바일 사파리에서 뒤로가기 시 떠나는 화면(old 스냅샷)이 잠깐 남았다 사라지는 깜빡임이 있어,
 * POP에서는 트랜지션 콜백만 즉시 실행해 이를 없앤다.
 *
 * popstate로 뒤로가기를 표시해두고, 그 직후 React Router가 비동기로 호출하는
 * 첫 startViewTransition이 플래그를 소비(consume)해 건너뛴다.
 */
export function useSkipBackNavigationTransition({ enabled }: { enabled: boolean }) {
  useEffect(() => {
    if (!enabled) return;

    const startTransition = document.startViewTransition?.bind(document);
    if (startTransition == null) return;

    // popstate 직후 React Router가 startTransition으로 감싸 비동기로 VT를 부르므로,
    // microtask로 리셋하면 VT 호출 전에 플래그가 꺼진다. 다음 VT 호출이 직접 소비(consume)하게 둔다.
    let isBackNavigation = false;
    const markBackNavigation = () => isBackNavigation = true;
    window.addEventListener('popstate', markBackNavigation);

    document.startViewTransition = (callback) => {
      const shouldSkip = isBackNavigation;
      isBackNavigation = false;
      if (shouldSkip) return createSkippedViewTransition(callback);
      return startTransition(callback);
    };

    return () => {
      window.removeEventListener('popstate', markBackNavigation);
      document.startViewTransition = startTransition;
    };
  }, [enabled]);
}

/**
 * 트랜지션 없이 DOM 업데이트 콜백만 즉시 실행하고, 이미 완료된 트랜지션처럼 동작하는 객체를 반환한다.
 */
function createSkippedViewTransition(
  callback?: ViewTransitionUpdateCallback | StartViewTransitionOptions,
): ViewTransition {
  const update = typeof callback === 'function' ? callback : callback?.update;
  const updated = Promise.resolve(update?.()).then(() => undefined);

  // ViewTransition은 브라우저가 생성하는 타입이라 생성자가 없다. 완료 상태 더미를 단언으로 만든다.
  return {
    updateCallbackDone: updated,
    ready: updated,
    finished: updated,
    skipTransition: () => {},
    types: new Set<string>(),
  } as ViewTransition;
}
