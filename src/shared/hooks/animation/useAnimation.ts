import { useRef, useState, useCallback } from "react"
import { useSyncableRef } from "../extends/useSyncableRef"

type Frames = Keyframe[] | PropertyIndexedKeyframes

export type AnimationSpec = {
  frames: Frames
  duration?: number
  easing?: string
  fill?: FillMode
  iterations?: number
  delay?: number
  direction?: PlaybackDirection
}


type PlayWithDefaultElement = (
  spec?: Partial<AnimationSpec>
) => Promise<void>

type PlayWithoutElement<T extends Element> = (
  target: T,
  spec?: Partial<AnimationSpec>
) => Promise<void>

type UseAnimationReturnWithElement = {
  play: PlayWithDefaultElement;
  stop: () => void
  pause: () => void
  reverse: () => Promise<void>
  scrub: (progress: number) => void
  isRunning: boolean
  animation: React.MutableRefObject<Animation | null>
}

type UseAnimationReturnWithoutElement<T extends Element> = {
  play: PlayWithoutElement<T>
  stop: () => void
  pause: () => void
  reverse: () => void
  scrub: (progress: number) => void
  isRunning: boolean
  animation: React.MutableRefObject<Animation | null>
}

export function useAnimation<T extends Element>(
  spec: AnimationSpec,
  element: T | null,
): UseAnimationReturnWithElement;

export function useAnimation<T extends Element>(
  spec: AnimationSpec
): UseAnimationReturnWithoutElement<T>

/*
 구현
*/

export function useAnimation<T extends Element>(
  baseSpec: AnimationSpec,
  element?: T | null,
): UseAnimationReturnWithElement | UseAnimationReturnWithoutElement<T> {
  const animationRef = useRef<Animation | null>(null)
  const baseSpecRef = useSyncableRef(baseSpec)

  const [isRunning, setRunning] = useState(false)

  const buildAnimation = useCallback(
    (target: Element, spec: AnimationSpec) => {
      const effect = new KeyframeEffect(target, spec.frames, {
        duration: spec.duration,
        easing: spec.easing,
        fill: spec.fill ?? "forwards",
        iterations: spec.iterations ?? 1,
        delay: spec.delay,
        direction: spec.direction
      })

      return new Animation(effect, document.timeline)
    },
    []
  )

  const stop = useCallback(() => {
    animationRef.current?.cancel()
    setRunning(false)
  }, [])

  const scrub = useCallback((progress: number) => {
    const anim = animationRef.current
    if (!anim) return
    anim.pause()
    const duration = (anim.effect as KeyframeEffect)?.getTiming().duration
    if (typeof duration === 'number') {
      anim.currentTime = progress * duration
    }
  }, [])

  const pause = useCallback(() => {
    animationRef.current?.pause()
  }, [])

  const reverse = useCallback(async () => {
    animationRef.current?.reverse()
    await animationRef.current?.finished;
  }, [])

  const play = useCallback(
    async (...args: Parameters<PlayWithDefaultElement> | Parameters<PlayWithoutElement<T>>) => {
      const overrideElement = args.length === 2 ? args[0] : null;
      const overrideSpec = args.length === 2 ? args[1] : args[0];

      const base = baseSpecRef.current

      const target = overrideElement ?? element

      if (!target) {
        throw new Error("Animation element is required")
      }

      const spec: AnimationSpec = {
        ...base,
        ...overrideSpec
      }

      const animation = buildAnimation(target, spec)

      animationRef.current = animation

      setRunning(true)

      animation.play()

      try {
        await animation.finished
      } finally {
        setRunning(false)
      }
    },
    [element, buildAnimation]
  )

  return {
    play,
    stop,
    pause,
    reverse,
    scrub,
    isRunning,
    animation: animationRef
  }
}

export type AnimationApi = ReturnType<typeof useAnimation<HTMLDivElement>>;

export const Easing = {
  // preset keywords
  Linear: "linear",
  Ease: "ease",
  EaseIn: "ease-in",
  EaseOut: "ease-out",
  EaseInOut: "ease-in-out",
  StepStart: "step-start",
  StepEnd: "step-end",

  // commonly used bezier presets
  Standard: "cubic-bezier(0.4, 0, 0.2, 1)",
  Decelerate: "cubic-bezier(0, 0, 0.2, 1)",
  Accelerate: "cubic-bezier(0.4, 0, 1, 1)",
  Sharp: "cubic-bezier(0.4, 0, 0.6, 1)",

  // helpers
  cubicBezier: (
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ) => `cubic-bezier(${x1}, ${y1}, ${x2}, ${y2})`,

  steps: (
    count: number,
    position?:
      | "jump-start"
      | "jump-end"
      | "jump-none"
      | "jump-both"
      | "start"
      | "end"
  ) =>
    position
      ? `steps(${count}, ${position})`
      : `steps(${count})`,

  linear: (points: string) => `linear(${points})`,
} as const
