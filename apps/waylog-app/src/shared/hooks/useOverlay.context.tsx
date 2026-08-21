import { createContext, Fragment, useCallback, useState, type ReactElement, type ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'

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
      {/* 오버레이 층이 화면 크기를 갖도록 전체를 감싼다.
          크기가 없는 부모 아래에서는 바텀시트가 높이를 못 잡아 보이지 않는다. */}
      <View style={{ flex: 1 }}>
        {children}

        {/* pointerEvents="box-none" 이라 빈 곳의 터치는 아래로 통과한다. */}
        <View
          style={StyleSheet.absoluteFill}
          pointerEvents="box-none"
        >
          {Array.from(overlays.entries()).map(([id, element]) => (
            <Fragment key={id}>{element}</Fragment>
          ))}
        </View>
      </View>
    </OverlayContext.Provider>
  )
}
