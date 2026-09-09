import { useEffect, useRef, useState } from 'react'
import { Easing } from 'react-native-reanimated'

const COUNT_DURATION = 260
const ease = Easing.out(Easing.quad)

export function useAnimatedCount(destination: number): number {
  const [current, setCurrent] = useState(destination)
  const frameRef = useRef<number | null>(null)

  const currentRef = useRef(current)
  currentRef.current = current

  useEffect(() => {
    const startFrom = currentRef.current
    if (startFrom === destination) return

    const startedAt = Date.now()

    const step = () => {
      const ratio = Math.min((Date.now() - startedAt) / COUNT_DURATION, 1)
      setCurrent(Math.round(startFrom + (destination - startFrom) * ease(ratio)))

      if (ratio < 1) frameRef.current = requestAnimationFrame(step)
    }

    frameRef.current = requestAnimationFrame(step)

    return () => {
      if (frameRef.current != null) cancelAnimationFrame(frameRef.current)
    }
  }, [destination])

  return current
}
