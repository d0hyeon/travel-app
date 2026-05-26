import { useEffect, useState } from "react";

export function useElementSize<T extends HTMLElement>() {
  const [element, setElement] = useState<T>()
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);


  useEffect(() => {
    if (element) {
      const obsever = new ResizeObserver(([entry]) => {
        const [rect] = entry.borderBoxSize;
        setSize({ width: rect.inlineSize, height: rect.blockSize });
      });

      obsever.observe(element);

      return () => obsever.unobserve(element);
    }
  }, [element])

  return [size, setElement] as const;
}