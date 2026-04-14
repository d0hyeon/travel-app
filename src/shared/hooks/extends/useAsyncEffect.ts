import { useEffect, type DependencyList } from "react";

export function useAsyncEffect(callback: (isCanceled: boolean) => any, deps?: DependencyList) {

  useEffect(() => {
    let mounted = true;
    if (mounted) {
      callback(mounted);
    }
    return () => {
      mounted = false;
    }
  }, deps)
}