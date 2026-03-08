import { useEffect, useMemo, useState } from "react"
import type { AnimationApi } from "./useAnimation"
import { useVariation } from "./useVariation"
import { assert } from "~shared/lib/assert"
import { throttle } from "~shared/utils/throttle";

export type DefaultDriverState = { progress: number };

export type Driver<TState = { progress: number }> = {
  start(): void
  stop(): void

  subscribe(
    fn: (state: TState) => void
  ): () => void

  getCurrentState(): TState
}

export function useDriver(animation: AnimationApi, driver: Driver) {
  const [current, setCurrent] = useState(
    driver.getCurrentState()
  )
  const [status, setStatus] = useState<'end' | 'start' | null>(null);

  const [getIsAccesedState, setIsAccesedState] = useVariation(false);

  useEffect(() => {
    const unsubscribe = driver.subscribe((state) => {
      const isAccessed = getIsAccesedState();
      if (isAccessed) {
        setCurrent(state)
      }
      setStatus(state.progress === 0
        ? 'start'
        : state.progress === 1
          ? 'end'
          : null
      );
      

      if (animation?.scrub) {
        animation.scrub(state.progress)
      }
    })

    driver.start()

    return () => {
      unsubscribe()
      driver.stop()
    }
  }, [animation, driver]);

  return useMemo(() => {
    const data = {
      process: current.progress,
      isStart: status === 'start',
      isEnd: status === 'end'
    }

    return new Proxy(data, {
      get: (_, key) => {
        if (typeof key === 'string') {
          if (key === 'current') {
            setIsAccesedState(true);
          }
          // @ts-ignore
          return data[key];
        }
      }
    })
  }, [current.progress, status]); 
}

type CreateScrollDriverOptions = {
  throttleTime?: number;
}

export function createScrollDriver(
  container: Window | HTMLElement | null,
  { throttleTime = 0 }: CreateScrollDriverOptions = {}  
) {
  let listeners: ((state: DefaultDriverState) => void)[] = []

  let state = { progress: 0 }

  const calcProgress = throttle(() => {
    const scrollTop =
      container === window
        ? window.scrollY
        : (container as HTMLElement).scrollTop

    const max =
      container === window
        ? document.documentElement.scrollHeight - window.innerHeight
        : (container as HTMLElement).scrollHeight -
          (container as HTMLElement).clientHeight

    state = {
      progress: max === 0 ? 0 : scrollTop / max
    }

    listeners.forEach((fn) => fn(state))
  }, throttleTime)

  return {
    start() {
      assert(!!container, '노드가 제공되지 않았습니다.');
      container.addEventListener("scroll", calcProgress)
      calcProgress()
    },

    stop() {
      assert(!!container, '노드가 제공되지 않았습니다.');
      container.removeEventListener("scroll", calcProgress)
    },

    subscribe(fn: (state: DefaultDriverState) => void) {
      listeners.push(fn)

      return () => {
        listeners = listeners.filter((l) => l !== fn)
      }
    },

    getCurrentState() {
      return state
    }
  }
}