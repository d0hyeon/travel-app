import { useEffect, useEffectEvent, useMemo } from "react";
import { useVariation } from "../extends/useVariation";
import { debounce } from "@mui/material";
import { throttle } from "~shared/utils/throttle";

type Hooks = {
  onScroll?: (event: Event) => void;
  onScrollStart?: (event: Event) => void;
  onScrollEnd?: (event: Event) => void;
}
export function useScrollEventListener<T extends HTMLElement>(target: T | Window | null, hooks: Hooks) {
  const [getIsStart, setIsStart] = useVariation(false);
  const onScroll = useEffectEvent((event: Event) => {
    console.log('run')
    if (getIsStart()) {
      hooks?.onScroll?.(event);
      return;
    }

    setIsStart(true);
    hooks.onScrollStart?.(event);
  });

  const handleScroll = useMemo(() => throttle(onScroll, 1000),[]);

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