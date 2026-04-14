import { useEffect, type RefObject } from 'react'
import { useLocation } from 'react-router'

/**
 * 커스텀 스크롤 컨테이너의 스크롤 위치를 복원한다.
 *
 * React Router의 <ScrollRestoration />은 window 스크롤만 추적하므로,
 * overflow: auto 컨테이너처럼 window가 아닌 요소에서 스크롤이 일어날 때 사용한다.
 * - location.key 기준으로 sessionStorage에 위치를 저장/복원한다.
 */
export function useScrollRestore<T extends HTMLElement>(containerRef: RefObject<T | null>) {
  const location = useLocation()

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const storageKey = `scroll-restore:${location.key}`
    const saved = sessionStorage.getItem(storageKey)
    container.scrollTop = saved != null ? Number(saved) : 0

    return () => {
      sessionStorage.setItem(storageKey, String(container.scrollTop))
    }
  }, [location.key])
}
