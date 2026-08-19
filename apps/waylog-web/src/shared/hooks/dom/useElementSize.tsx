import { useEffect, useState } from "react";

export function useElementSize<T extends HTMLElement>({ once = false }: { once?: boolean } = {}) {
  const [element, setElement] = useState<T>()
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);


  useEffect(() => {
    if (element) {
      const obsever = new ResizeObserver(([entry]) => {
        const [rect] = entry.borderBoxSize;
        setSize({ width: rect.inlineSize, height: rect.blockSize });
        if (once) {
          obsever.unobserve(element);
        }
      });

      obsever.observe(element);

      return () => obsever.unobserve(element);
    }
  }, [element, once])

  return [size, setElement] as const;
}