import { useCallback, useState } from 'react'
import { useStorageStore } from '../../../shared/hooks/useStorageStore'

interface Options {
  size?: number
  expireDays?: number
}

interface StoredKeyword {
  createdAt: number
  value: string
}

const DAY_MS = 24 * 60 * 60 * 1000

// 웹 useLaststSearchKeywords 와 같은 반환 시그니처를 유지한다.
// 저장은 웹 localStorage(동기) 대신 앱 useStorageStore(AsyncStorage 비동기)를 쓴다.
export function useLastSearchKeywords({ size = 20, expireDays = 3 }: Options = {}) {
  const [keywords, setKeywords] = useStorageStore<StoredKeyword[]>('place-search-keywords', [])

  // 렌더 중 Date.now() 를 직접 부르지 않도록 마운트 시점 기준값을 고정한다.
  const [expireBefore] = useState(() => Date.now() - expireDays * DAY_MS)
  const activeKeywords = keywords.filter((keyword) => keyword.createdAt >= expireBefore)

  const record = useCallback(
    (value: string) => {
      const keyword: StoredKeyword = { createdAt: Date.now(), value }
      setKeywords([keyword, ...activeKeywords.filter((x) => x.value !== value)].slice(0, size))
    },
    [activeKeywords, setKeywords, size],
  )

  const remove = useCallback(
    (value: string) => {
      setKeywords(activeKeywords.filter((x) => x.value !== value))
    },
    [activeKeywords, setKeywords],
  )

  return {
    data: activeKeywords.map((x) => x.value),
    record,
    remove,
  }
}
