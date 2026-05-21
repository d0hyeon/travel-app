import { useMemo, useRef, useState } from "react";
import { useScrollEventListener } from "./useScrollEventListener";
import { usePrevValue } from "../extends/usePrevValue";

export function useScrollStatus<T extends HTMLElement>(target: T | null) {
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollX, setScrollX] = useState(0);
  const [scrollY, setScrollY] = useState(0);  
  const prevStatus = usePrevValue([scrollY, scrollX]);

  const baseStatus = { isScrolling, scrollX, scrollY, isScrollDown: prevStatus[0] < scrollY };
  const accessorRef = useRef<Record<keyof typeof baseStatus, boolean>>({
    isScrolling: false,
    scrollX: false,
    scrollY: false,
    isScrollDown: false
  });
  
  useScrollEventListener(target, {
    onScrollStart: () => {
      if (accessorRef.current.isScrolling) {
        setIsScrolling(true);
      }
    },
    onScrollEnd: () => {
      if (accessorRef.current.isScrolling) {
        setIsScrolling(false);
      }
    },
    onScroll: (event) => {
      const target = event.currentTarget as T;
      const { scrollTop, scrollLeft } = target
      if (accessorRef.current.scrollX) {
        setScrollX(scrollLeft);
      }
      if (accessorRef.current.scrollY || accessorRef.current.isScrollDown) {
        setScrollY(scrollTop);
      }
    }
  })

  return useMemo(() => {    
    return new Proxy(baseStatus, {
      get: (target, accessor) => {
        if (typeof accessor === 'string') {
          if (accessor in accessorRef.current) {
            // @ts-ignore  
            accessorRef.current[accessor] = true;
          }
          // @ts-ignore
          return target?.[accessor]
        }
      }
    })
    
  }, [isScrolling, scrollX, scrollY])
}

