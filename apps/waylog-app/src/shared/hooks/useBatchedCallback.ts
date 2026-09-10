import { useCallback, useRef } from 'react'
import { useCleanup, usePreservedCallback } from '@waylog/react'

interface Options {
  once?: boolean
}

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

  // 예약된 프레임은 언마운트 뒤에도 발화한다. 남겨두면 사라진 컴포넌트를 갱신한다.
  useCleanup(() => {
    if (scheduledIdRef.current == null) return
    cancelAnimationFrame(scheduledIdRef.current)
    scheduledIdRef.current = null
  })

  return collect
}
