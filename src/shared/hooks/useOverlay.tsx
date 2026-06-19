import { createContext, Fragment, startTransition, useCallback, useContext, useEffect, useImperativeHandle, useRef, useState, type ReactElement, type ReactNode, type Ref } from 'react';

export interface OverlayRenderProps {
  isOpen: boolean;
  close: () => void;
}

type OverlayElement = (controller: OverlayRenderProps) => ReactNode

interface OverlayContextValue {
  mount: (id: string, element: ReactElement) => void
  unmount: (id: string) => void
}

const OverlayContext = createContext<OverlayContextValue | null>(null)

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


type OverlayItemRef = {
  close: () => void;
}
function OverlayItem({
  element,
  onClose,
  ref
}: {
  element: OverlayElement
  onClose: () => void
  ref?: Ref<OverlayItemRef>
}) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    startTransition(() => setIsOpen(true));
  }, [])

  const close = useCallback(() => {
    if (isOpen) {
      setIsOpen(false);
      // 애니메이션 후 unmount
      setTimeout(onClose, 300)
    }
  }, [isOpen])

  useImperativeHandle<OverlayItemRef, OverlayItemRef>(ref, () => ({
    close
  }), [close])

  return <>{element({ isOpen, close })}</>
}

let id = 0;
function getId() {
  id++;
  return id;
}

export function useOverlay() {
  const context = useContext(OverlayContext)
  if (!context) {
    throw new Error('useOverlay must be used within OverlayProvider')
  }

  const { mount, unmount } = context;

  const idRef = useRef<number | null>(null);
  const ref = useRef<OverlayItemRef>(null);

  const open = useCallback(
    (element: OverlayElement) => {
      const id = getId();
      idRef.current = id;
      const overlayElement = <OverlayItem ref={ref} element={element} onClose={() => unmount(id.toString())} />
      mount(id.toString(), overlayElement);

      return () => ref.current?.close()
    },
    [id, mount, unmount]
  )

  const close = useCallback(() => {
    ref.current?.close()
  }, [])

  return { open, close }
}
