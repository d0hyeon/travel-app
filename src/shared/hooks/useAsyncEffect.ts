import { useEffect, type DependencyList } from "react";

export function useAsyncEffect(callback: () => any, deps?: DependencyList) {

  useEffect(() => {
    let mounted = true;
    if (mounted) {
      callback();
    }
    return () => {
      mounted = false;
    }
  }, deps)
}