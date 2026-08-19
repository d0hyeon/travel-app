import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type PropsWithChildren,
} from 'react'

type ExtrudeProps = PropsWithChildren<{
  active: boolean
  target: HTMLElement | null

  duration?: number
  easing?: string

  fadeTarget?: boolean

  axis?: 'x' | 'y' | 'both'

  className?: string
  style?: CSSProperties
}>

export function Extrude({
  active,
  target,
  children,
  duration = 300,
  easing = 'cubic-bezier(0.4, 0, 0.2, 1)',
  fadeTarget = true,
  axis = 'both',
  className,
  style,
}: ExtrudeProps) {
  const ref = useRef<HTMLDivElement>(null)

  /**
   * 최초 위치 고정
   * transform 누적 방지
   */
  const initialRectRef =
    useRef<DOMRect | null>(null)

  const [motionStyle, setMotionStyle] =
    useState<CSSProperties>({
      transform: 'translate3d(0px,0px,0px)',
    })

  /**
   * 최초 rect 저장
   */
  useLayoutEffect(() => {
    if (!ref.current) return

    initialRectRef.current =
      ref.current.getBoundingClientRect()
  }, [])

  useLayoutEffect(() => {
    if (!ref.current || !target || !initialRectRef.current) {
      return
    }

    let raf = 0
    const update = () => {
      if (!ref.current || !target || !initialRectRef.current) {
        return
      }

      const sourceRect = initialRectRef.current
      const targetRect = target.getBoundingClientRect()

      /**
       * 위치 차이 계산
       */
      const rawDx = targetRect.left - sourceRect.left
      const rawDy = targetRect.top - sourceRect.top

      const dx = axis === 'y' ? 0 : rawDx
      const dy = axis === 'x' ? 0 : rawDy

      /**
       * target fade
       */
      if (fadeTarget) {
        target.style.transition = `
          opacity ${duration}ms ${easing}
        `
        target.style.opacity = active
          ? '0'
          : '1'
      }

      /**
       * extrude motion
       */
      setMotionStyle({
        transform: active
          ? `translate3d(${dx}px, ${dy}px, 0)`
          : `translate3d(0px,0px,0px)`,
      })
    }

    const schedule = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(update)
    }

    schedule()

    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)

    return () => {
      cancelAnimationFrame(raf)

      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [
    active,
    target,
    duration,
    easing,
    fadeTarget,
    axis,
  ])

  return (
    <div
      ref={ref}
      className={className}
      style={{
        transformOrigin: 'top left',
        width: 'fit-content',
        willChange: 'transform, opacity',
        transition: `transform ${duration}ms ${easing}`,
        ...motionStyle,
        ...style,
      }}
    >
      {children}
    </div>
  )
}