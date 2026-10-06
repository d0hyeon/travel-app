import { useEffect, useEffectEvent } from "react";
import { useVariation } from "@waylog/react";

interface Handlers {
  onScroll?: (event: Event) => void;
  onScrollStart?: (event: Event) => void;
  onScrollEnd?: (event: Event) => void;
}

interface Options extends Handlers {
  enabled?: boolean;
}

export function useScrollEventListener<T extends HTMLElement>(target: T | Window | null, options: Options) {
  const [getIsStart, setIsStart] = useVariation(false);
  const handleScroll = useEffectEvent((event: Event) => {
    if (getIsStart()) {
      options?.onScroll?.(event);
      return;
    }

    setIsStart(true);
    options.onScrollStart?.(event);
  });

  

  const handleScrollEnd = useEffectEvent((event: Event) => {
    options.onScrollEnd?.(event);
  })

  useEffect(() => {
    if (target && options.enabled !== false) {
      target.addEventListener('scroll', handleScroll);
      target.addEventListener('scrollend', handleScrollEnd);

      return () => {
        target.removeEventListener('scroll', handleScroll);
        target.removeEventListener('scrollend', handleScrollEnd);
      }
    }
  }, [target, options.enabled])
}