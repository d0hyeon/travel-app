import { useEffect } from "react";

let isResotred = false;

export function BFCacheListener() {
  useEffect(() => {
    const handler = (event: PageTransitionEvent) => {
      isResotred = event.persisted;
    }

    window.addEventListener('pageshow', handler);
    window.addEventListener('pagehide', handler);

    return () => {
      window.removeEventListener('pageshow', handler);
      window.removeEventListener('pagehide', handler);
    }
  }, []);
  return null;
}

export function useIsBFCacheRestored() {
  return isResotred;
}