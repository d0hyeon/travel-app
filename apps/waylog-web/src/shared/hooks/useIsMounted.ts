import { useEffect, useRef } from "react";

export function useIsMounted() {
  const ref = useRef(false);

  useEffect(() => {
    requestAnimationFrame(() => {
      ref.current = true;
    });

    return () => {
      ref.current = false;
    }
  }, [])

  return ref.current;
}