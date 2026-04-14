import { useRef, useState, useCallback } from "react"

type Frames = Keyframe[] | PropertyIndexedKeyframes

type AnimationSpec = {
  frames: Frames
  duration?: number
  easing?: string
  fill?: FillMode
  iterations?: number
  delay?: number
  direction?: PlaybackDirection
}

type PlayOverride<T extends Element> = Partial<AnimationSpec> & {
  element?: T
}

type PlayWithDefaultElement<T extends Element> = (
  override?: PlayOverride<T>
) => Promise<void>

type PlayWithoutElement<T extends Element> = (
  override: PlayOverride<T> & { element: T }
) => Promise<void>

type UseAnimationReturnWithElement<T extends Element> = {
  play: PlayWithDefaultElement<T>
  stop: () => void
  pause: () => void
  reverse: () => void
  isRunning: boolean
  animation: React.MutableRefObject<Animation | null>
}

type UseAnimationReturnWithoutElement<T extends Element> = {
  play: PlayWithoutElement<T>
  stop: () => void
  pause: () => void
  reverse: () => void
  isRunning: boolean
  animation: React.MutableRefObject<Animation | null>
}

export function useAnimation<T extends Element>(
  spec: AnimationSpec,
  element: T | null,
): UseAnimationReturnWithElement<T>

export function useAnimation<T extends Element>(
  spec: AnimationSpec
): UseAnimationReturnWithoutElement<T>

/*
 구현
*/

export function useAnimation<T extends Element>(
  baseSpec: AnimationSpec,
  element?: T | null,
) {
  const animationRef = useRef<Animation | null>(null)
  const baseSpecRef = useRef(baseSpec)

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

  const pause = useCallback(() => {
    animationRef.current?.pause()
  }, [])

  const reverse = useCallback(() => {
    animationRef.current?.reverse()
  }, [])

  const play = useCallback(
    async (override: PlayOverride<T> = {}) => {
      const base = baseSpecRef.current

      const target = override.element ?? element

      if (!target) {
        throw new Error("Animation element is required")
      }

      const spec: AnimationSpec = {
        ...base,
        ...override
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
    isRunning,
    animation: animationRef
  }
}

export type AnimationApi = {
  play(options?: Partial<PlayWithDefaultElement<Element>>): Promise<void>

  stop(): void

  scrub(progress: number): void

  pause(): void

  resume(): void

  isPlaying(): boolean
}

