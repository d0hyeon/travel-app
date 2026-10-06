import { useCallback, useEffect, useEffectEvent, useRef } from 'react';

type Reason = 'escape' | 'click-external';
type Options = {
  enabled?: boolean;
};
/** 사용자의 종료 요청을 수신합니다. */
export function useDismissCallback<Target extends HTMLElement>(
  callback: (reason: Reason) => void,
  { enabled = true }: Options = {},
) {
  const preservedCallback = useEffectEvent(callback);

  const targetsRef = useRef<Set<Target>>(new Set());

  useEffect(() => {
    if (!enabled) return;
    const handleKeyInput = (event: KeyboardEvent) => {
      if (event.code === 'Escape') {
        preservedCallback('escape');
      }
    };
    const handleMouseInput = (event: MouseEvent) => {
      const isContain = targetsRef.current.values().some((node) => {
        return (event.target instanceof Node && node.contains(event.target)) || node === event.target;
      });

      if (!isContain) {
        preservedCallback('click-external');
      }
    };

    document.body.addEventListener('keyup', handleKeyInput);
    document.body.addEventListener('click', handleMouseInput);

    return () => {
      document.body.removeEventListener('keyup', handleKeyInput);
      document.body.removeEventListener('click', handleMouseInput);
    };
  }, [enabled]);

  return useCallback((node: Target | null) => {
    if (node != null) {
      targetsRef.current.add(node);
    }
  }, []);
}
