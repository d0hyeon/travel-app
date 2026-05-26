import { useEffect, useMemo, useRef, useState } from "react";
import { useScrollEventListener } from "./useScrollEventListener";
import { usePrevValue } from "../extends/usePrevValue";
import { useVariation } from "../extends/useVariation";

export function useScrollStatus<T extends HTMLElement>(target: T | null) {
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollX, setScrollX] = useState(0);
  const [scrollY, setScrollY] = useState(0);  

  const [getPrevStatus, setPrevStatus] = useVariation({ isScrolling, scrollX, scrollY, isScrollDown: false });
  const prevStatus = getPrevStatus();
  const isScrollDown = prevStatus.scrollY === scrollY
    ? prevStatus.isScrollDown
    : prevStatus.scrollY < scrollY;
  const currentStatus = { isScrolling, scrollX, scrollY, isScrollDown };

  useEffect(() => {
    setPrevStatus(currentStatus);
  }, [scrollX, scrollY]);
  

  const accessorRef = useRef<Record<keyof typeof currentStatus, boolean>>({
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
      const target = (event.currentTarget ?? event.target) as T;
      const { scrollTop, scrollLeft } = target

      if (accessorRef.current.scrollX) {
        setScrollX(scrollLeft);
      }
      if (accessorRef.current.scrollY || accessorRef.current.isScrollDown) {
        setScrollY(Math.max(scrollTop, 0));
      }
    }
  })

  return useMemo(() => {    
    return new Proxy(currentStatus, {
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

