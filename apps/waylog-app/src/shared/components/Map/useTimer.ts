import { useVariation } from '@waylog/react'
import { useCleanup } from '@waylog/react'

/** 한 번에 하나만 살아 있는 타이머. 다시 걸면 이전 것은 취소된다. */
export function useTimer() {
  const [getId, setId] = useVariation<ReturnType<typeof setTimeout> | null>(null)

  const cancel = () => {
    const id = getId()
    if (id == null) return

    clearTimeout(id)
    setId(null)
  }

  const start = (delay: number, callback?: () => void) => {
    cancel()
    setId(
      setTimeout(() => {
        setId(null)
        callback?.()
      }, delay),
    )
  }

  useCleanup(cancel)

  return { start, cancel, isRunning: () => getId() != null }
}
