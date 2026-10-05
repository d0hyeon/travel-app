import { useMemo, useSyncExternalStore } from "react";

const KEYBOARD_MIN_HEIGHT = 100;

export function useKeyboardStatus() {
  const difference = useSyncExternalStore(
    (callback) => {
      window.visualViewport?.addEventListener('resize', callback);
      return () => {
        window.visualViewport?.removeEventListener('resize', callback);
      }
    },
    () => {
      if (!window.visualViewport) return 0;
      return window.innerHeight - window.visualViewport.height;
    }
  ) 

  return useMemo(() => {
    if (difference >= KEYBOARD_MIN_HEIGHT) {
      return { isOpen: true, height: difference };
    }
    return { isOpen: false, height: 0 }
  }, [difference])
}