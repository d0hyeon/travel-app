import { useCallback, useEffect, useRef } from "react";

type AnyFunction = (...args: any) => any;

export function usePreservedCallback<Fn extends AnyFunction>(callback: Fn) {
  const ref = useRef(callback);

  useEffect(() => {
    ref.current = callback;
  }, [callback])

  return useCallback((...params: Parameters<Fn>) => callback(...params), []);
}