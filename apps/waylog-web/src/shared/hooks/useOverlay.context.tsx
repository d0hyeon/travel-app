import { createContext, Fragment, useCallback, useState, type ReactElement, type ReactNode } from 'react';

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
      {Array.from(overlays.entries()).map(([id, element]) => (
        <Fragment key={id}>{element}</Fragment>
      ))}
    </OverlayContext.Provider>
  )
}
