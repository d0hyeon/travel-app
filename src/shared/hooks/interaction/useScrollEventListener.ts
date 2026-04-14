import { useEffect, useEffectEvent } from "react";
import { useVariation } from "../extends/useVariation";

type Hooks = {
  onScroll?: (event: Event) => void;
  onScrollStart?: (event: Event) => void;
  onScrollEnd?: (event: Event) => void;
}
export function useScrollEventListener<T extends HTMLElement>(target: T | null, hooks: Hooks) {
  const [getIsStart, setIsStart] = useVariation(false);
  const handleScroll = useEffectEvent((event: Event) => {
    if (getIsStart()) { 
      return hooks?.onScroll?.(event);
    }
    setIsStart(true);
    hooks.onScrollStart?.(event)
  })

  const handleScrollEnd = useEffectEvent((event: Event) => {
    hooks.onScrollEnd?.(event);
  })

  useEffect(() => {
    if (target) {
      target.addEventListener('scroll', handleScroll);
      target.addEventListener('scrollend', handleScrollEnd);

      return () => {
        target.removeEventListener('scroll', handleScroll);
        target.removeEventListener('scrollend', handleScrollEnd);
      }
    }
  }, [target])
}