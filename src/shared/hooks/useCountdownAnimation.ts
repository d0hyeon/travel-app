import { useEffect, useState } from "react";
import { useVariation } from "./useVariation";

interface Options {
  enabled?: boolean;
  duration?: number;
  delay?: number;
}

export function useCountAnimation(
  targetValue: number,
  { enabled = true, duration = 800, delay = 0 }: Options = {}
) {
  const [displayValue, setDisplayValue] = useState(enabled ? 0 : targetValue);
  const [getPrevValue, setPrevValue] = useVariation(displayValue);

  useEffect(() => {
    if (!enabled) {
      setDisplayValue(targetValue)
      return
    }

    const timeoutId = setTimeout(() => {
      const startTime = Date.now()
      const startValue = getPrevValue();

      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        // easeOutQuart for smooth deceleration
        const eased = 1 - Math.pow(1 - progress, 4)
        const current = Math.round(startValue + (targetValue - startValue) * eased)
        setDisplayValue(current)
        setPrevValue(current)

        if (progress < 1) {
          requestAnimationFrame(animate)
        }
      }

      requestAnimationFrame(animate)
    }, delay)

    return () => clearTimeout(timeoutId)
  }, [targetValue, enabled, duration, delay])

  return displayValue;
}