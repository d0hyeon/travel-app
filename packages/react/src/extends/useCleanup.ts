import { useEffect, type DependencyList } from "react";

export function useCleanup(callback: () => void, deps: DependencyList = []) {
  useEffect(() => {
    return callback;
  }, deps)
}