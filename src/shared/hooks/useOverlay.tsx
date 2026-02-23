import { createContext, useContext, useState, useCallback, type ReactNode, useEffect, useId, useRef } from 'react'

interface OverlayController {
  isOpen: boolean
  close: () => void
}

type OverlayElement = (controller: OverlayController) => ReactNode

interface OverlayContextValue {
  mount: (id: string, element: OverlayElement) => void
  unmount: (id: string) => void
}

const OverlayContext = createContext<OverlayContextValue | null>(null)

let overlayId = 0

export function OverlayProvider({ children }: { children: ReactNode }) {
  const [overlays, setOverlays] = useState<Map<string, OverlayElement>>(new Map())

  const mount = useCallback((id: string, element: OverlayElement) => {
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
        <OverlayItem key={id} id={id} element={element} onClose={() => unmount(id)} />
      ))}
    </OverlayContext.Provider>
  )
}


function OverlayItem({
  id: _id,
  element,
  onClose,
}: {
  id: string
  element: OverlayElement
  onClose: () => void
}) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(true);
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
    // 애니메이션 후 unmount
    setTimeout(onClose, 1000)
  }, [onClose])

  return <>{element({ isOpen, close })}</>
}

export function useOverlay() {
  const context = useContext(OverlayContext)
  if (!context) {
    throw new Error('useOverlay must be used within OverlayProvider')
  }

  const { mount, unmount } = context;

  const id = useId();

  const open = useCallback(
    (element: OverlayElement) => {
      mount(id, element)
      return () => unmount(id)
    },
    [id, mount, unmount]
  )

  const close = useCallback(() => {
    unmount(id);
  }, [id, unmount])

  return { open, close }
}
