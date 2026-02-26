import { useSyncExternalStore } from "react";

export function useIsOpenedKeyboard() {
  return useSyncExternalStore(
    (callback) => {
      window.visualViewport?.addEventListener('resize', callback);
      return () => {
        window.visualViewport?.removeEventListener('resize', callback);
      }
    },
    () => {
      if (!window.visualViewport) return false;
      return window.innerHeight !== window.visualViewport.height;
    }
  )
}