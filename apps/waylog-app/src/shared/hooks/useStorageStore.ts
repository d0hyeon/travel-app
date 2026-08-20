import AsyncStorage from '@react-native-async-storage/async-storage'
import { useCallback, useEffect, useState } from 'react'

// 웹 useStorageStore 와 같은 [value, setValue] 시그니처를 유지한다.
// 웹은 localStorage(동기), 앱은 AsyncStorage(비동기)라 초기값으로 먼저 그린 뒤 읽어온다.
const cache = new Map<string, unknown>()

export function useStorageStore<T>(key: string, initialValue: T): [T, (next: T) => void] {
  const [value, setValue] = useState<T>(() => (cache.get(key) as T) ?? initialValue)

  useEffect(() => {
    if (cache.has(key)) return

    let cancelled = false
    AsyncStorage.getItem(key).then((stored) => {
      if (cancelled || stored == null) return
      const parsed = JSON.parse(stored) as T
      cache.set(key, parsed)
      setValue(parsed)
    })

    return () => {
      cancelled = true
    }
  }, [key])

  const update = useCallback(
    (next: T) => {
      cache.set(key, next)
      setValue(next)
      void AsyncStorage.setItem(key, JSON.stringify(next))
    },
    [key],
  )

  return [value, update]
}
