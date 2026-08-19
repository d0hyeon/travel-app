import { startTransition, useCallback, useContext, useEffect, useId, useImperativeHandle, useMemo, useRef, useState, type ReactNode, type Ref } from "react";
import { OverlayContext } from "./useOverlay.context";
import { usePreservedCallback } from "./extends/usePreservedCallback";

export function useOverlay() {
  const context = useContext(OverlayContext)
  if (!context) {
    throw new Error('useOverlay must be used within OverlayProvider')
  }

  const { mount, unmount } = context;

  const id = useId()
  const ref = useRef<OverlayRendererRef>(null);

  const requestClose = useCallback(() => {
    ref.current?.close();
  }, []);

  const handleClose = useCallback(() => {
    unmount(id);
    ref.current = null;
  }, [id, unmount])

  const open = useCallback(
    (element: OverlayElement) => {
      const overlayElement = (
        <OverlayRenderer
          ref={ref}
          element={element}
          onClose={handleClose}
        />
      )
      mount(id.toString(), overlayElement);

      return requestClose;
    },
    [id, mount, requestClose, handleClose]
  )

  return useMemo(() => ({
    open,
    close: requestClose,
    unmount: () => unmount(id)
  }), [id, open, requestClose, unmount])
}

interface OverlayRendererRef {
  close: () => void;
}
interface OverlayRendererProps {
  element: OverlayElement
  onClose: () => void
  ref?: Ref<OverlayRendererRef>
}

export interface OverlayRenderProps {
  isOpen: boolean;
  close: () => Promise<void>;
  onClose: () => void;
}

type OverlayElement = (controller: OverlayRenderProps) => ReactNode

function OverlayRenderer({
  element,
  onClose,
  ref
}: OverlayRendererProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    startTransition(() => setIsOpen(true));
  }, [])

  const handleClose = usePreservedCallback(onClose);
  const close = useCallback(() => {
    if (!isOpen) return Promise.resolve();

    return new Promise<void>((resolve) => {
      setIsOpen(false);
      // 애니메이션 후 unmount
      setTimeout(() => {
        handleClose();
        resolve();
      }, 300);
    })

  }, [isOpen])

  useImperativeHandle<OverlayRendererRef, OverlayRendererRef>(ref, () => ({
    close
  }), [close])

  return <>{element({ isOpen, close, onClose })}</>
}



