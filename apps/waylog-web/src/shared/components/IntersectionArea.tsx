import { Box, type BoxProps } from '@mui/material'
import { useEffect, useEffectEvent, useRef } from 'react'

interface IntersectionAreaProps extends BoxProps {
  /** 요소가 뷰포트에 진입할 때 호출 */
  onEnter?: () => void
  /** 요소가 뷰포트에서 벗어날 때 호출 */
  onLeave?: () => void
  /** Intersection Observer root 요소 */
  root?: Element | null
  /** root margin (e.g., '-50% 0px -50% 0px') */
  rootMargin?: string
  /** threshold (0-1) */
  threshold?: number | number[]
}

export function IntersectionArea({
  onEnter,
  onLeave,
  root,
  rootMargin = '0px',
  threshold = 0,
  children,
  ...boxProps
}: IntersectionAreaProps) {
  const ref = useRef<HTMLDivElement>(null)

  const handleEnter = useEffectEvent(() => onEnter?.());
  const handleLeave = useEffectEvent(() => onLeave?.())

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          handleEnter()
        } else {
          handleLeave();
        }
      },
      {
        root,
        rootMargin,
        threshold,
      }
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [root, rootMargin, Array.isArray(threshold) ? threshold.join() : threshold])

  return (
    <Box ref={ref} position="relative" {...boxProps}>
      {children}
    </Box>
  )
}
