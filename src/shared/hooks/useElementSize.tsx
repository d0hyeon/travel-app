import { useEffect, useState } from "react";

export function useElementSize<T extends HTMLElement>() {
  const [element, setElement] = useState<T>()
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);


  useEffect(() => {
    if (element) {
      const { width, height } = element.getBoundingClientRect();
      setSize({ width, height });

      const obsever = new ResizeObserver(([entry]) => {
        setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
      });

      obsever.observe(element);

      return () => obsever.unobserve(element);
    }
  }, [element])

  return [size, setElement] as const;
}