import { useCallback, useEffect, useRef } from "react";

export function useCurrentValue<T>(value: T) {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value
  }, [value])

  return useCallback(() => ref.current, [])
}