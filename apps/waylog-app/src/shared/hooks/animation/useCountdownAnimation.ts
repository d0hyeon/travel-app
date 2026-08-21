import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// React 19.1 에는 useEffectEvent 가 없다. 최신 콜백을 ref 로 들고 같은 역할을 한다.
function useEffectEvent<T extends (...args: never[]) => unknown>(handler: T): T {
  const ref = useRef(handler);
  ref.current = handler;
  return useCallback(((...args: never[]) => ref.current(...args)) as T, []);
}
import { useVariation } from "@waylog/react";

export interface CountAnimationOptions {
  enabled?: boolean;
  duration?: number;
  durationTarget?: 'iterate' | 'circle';
  delay?: number;
  onEnd?: () => void;
}

export function useCountAnimation(
  targetValue: number,
  { enabled = true, duration: _duration, durationTarget = 'circle', delay = 0, onEnd, }: CountAnimationOptions = {}
) {
  const [displayValue, setDisplayValue] = useState(enabled ? 0 : targetValue);
  const [getPrevValue, setPrevValue] = useVariation(displayValue);

  const duration = useMemo(() => {
    if (durationTarget === 'circle') {
      return _duration ?? 800;
    }
    return Math.abs(targetValue - getPrevValue()) * (_duration ?? 20)
  }, [targetValue, durationTarget, _duration]);

  const handleEnd = useEffectEvent(() => onEnd?.());
  
  useEffect(() => {
    if (!enabled) {
      setDisplayValue(targetValue)
      return
    }
    if (duration === 0) {
      return setDisplayValue(targetValue);
    }

    let animationId: null | number = null;
    const timeoutId = setTimeout(() => {
      const startTime = Date.now()
      const startValue = getPrevValue();

      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        // iterate 모드: 선형, circle 모드: easeOutQuart
        const eased = durationTarget === 'iterate'
          ? progress
          : 1 - Math.pow(1 - progress, 4)
        const current = Math.floor(startValue + (targetValue - startValue) * eased)
        setDisplayValue(current)
        setPrevValue(current)

        if (progress < 1) {
          animationId = requestAnimationFrame(animate)
        } else {
          handleEnd();
        }
      }

      animationId = requestAnimationFrame(animate)
    }, delay)

    return () => {
      clearTimeout(timeoutId);
      if (animationId) cancelAnimationFrame(animationId);
    }
  }, [targetValue, enabled, duration, delay])

  return displayValue;
}