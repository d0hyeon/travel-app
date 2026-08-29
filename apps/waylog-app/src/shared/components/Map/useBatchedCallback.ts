import { useCallback, useRef } from 'react'
import { usePreservedCallback } from '@waylog/react'

interface Options {
  once?: boolean
}

// 웹 shared/hooks/useBatchedCallback.ts 와 동일한 설계다.
// 같은 프레임 안에서 여러 번 모인 항목을 한 번의 flush 로 묶는다.
export function useBatchedCallback<T = never>(onFlush: (items: T[]) => void, { once = false }: Options = {}) {
  const itemsRef = useRef<T[]>([])
  const scheduledIdRef = useRef<number | null>(null)
  const flushedRef = useRef(false)

  const preservedCallback = usePreservedCallback(onFlush)

  const collect = useCallback((...args: [T] extends [never] ? [] : [item: T]) => {
    if (once && flushedRef.current) return

    if (args.length > 0) itemsRef.current.push(args[0] as T)

    if (scheduledIdRef.current != null) cancelAnimationFrame(scheduledIdRef.current)
    scheduledIdRef.current = requestAnimationFrame(() => {
      scheduledIdRef.current = null
      const items = itemsRef.current
      itemsRef.current = []
      if (once) flushedRef.current = true
      preservedCallback(items)
    })
  }, [once])

  return collect
}
