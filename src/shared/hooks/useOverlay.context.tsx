import { createContext, Suspense, useCallback, useState, type ReactElement, type ReactNode } from 'react';

/** @package { useOverlay.tsx } */
export interface OverlayContextValue {
  mount: (id: string, element: ReactElement) => void
  unmount: (id: string) => void
}
/** @package { useOverlay.tsx } */
export const OverlayContext = createContext<OverlayContextValue | null>(null)

export function OverlayProvider({ children }: { children: ReactNode }) {
  const [overlays, setOverlays] = useState<Map<string, ReactElement>>(new Map())

  const mount = useCallback((id: string, element: ReactElement) => {
    setOverlays((prev) => new Map(prev).set(id, element))
  }, [])

  const unmount = useCallback((id: string) => {
    setOverlays((prev) => {
      const next = new Map(prev)
      next.delete(id)
      return next
    })
  }, [])

  return (
    <OverlayContext.Provider value={{ mount, unmount }}>
      {children}
      {/*
        오버레이는 Outlet을 감싸는 Suspense 경계 바깥에서 렌더링되므로,
        오버레이 내부에서 suspend가 발생하면 잡아줄 경계가 없다.
        각 오버레이를 개별 Suspense로 감싸 비동기 콘텐츠가 모두 준비된 뒤
        마운트되도록 한다 (바텀시트 자동 높이 측정이 완성된 콘텐츠 기준으로
        이뤄지게 하는 효과도 있음).
      */}
      {Array.from(overlays.entries()).map(([id, element]) => (
        <Suspense key={id} fallback={null}>{element}</Suspense>
      ))}
    </OverlayContext.Provider>
  )
}
