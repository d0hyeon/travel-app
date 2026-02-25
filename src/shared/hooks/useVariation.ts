import { useRef } from "react";

export function useVariation<T>(initialValue?: T) {
  const ref = useRef<T>(initialValue);

  return [
    () => ref.current,
    (next: T) => ref.current = next,
  ] as const;
}