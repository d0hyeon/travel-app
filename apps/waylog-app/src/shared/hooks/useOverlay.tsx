import { usePreservedCallback } from '@waylog/react'
import {
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type Ref,
} from 'react'
import { OverlayContext } from './useOverlay.context'

// 웹 shared/hooks/useOverlay 와 동일한 시그니처를 유지한다.
// 호출부 코드가 양쪽에서 같아야 하므로 이름과 인자를 바꾸지 않는다.
export function useOverlay() {
  const context = useContext(OverlayContext)
  if (!context) {
    throw new Error('useOverlay must be used within OverlayProvider')
  }

  const { mount, unmount } = context

  const id = useId()
  const ref = useRef<OverlayRendererRef>(null)
  // open 할 때마다 증가한다. 닫힘 애니메이션이 끝난 시점에
  // 그 사이 재오픈이 있었는지 판별하는 데 쓴다.
  const openCountRef = useRef(0)

  const requestClose = useCallback(() => {
    ref.current?.close()
  }, [])

  const open = useCallback(
    (element: OverlayElement) => {
      // 이전 오버레이가 떠 있으면 닫힘 애니메이션을 태워 보낸다.
      // 그냥 덮어쓰면 즉시 사라지고 이전 close 는 호출할 수 없게 된다.
      ref.current?.close()

      openCountRef.current += 1
      const openedAt = openCountRef.current

      const handleClose = () => {
        // 이미 다음 오버레이가 열렸다면 그 오버레이를 언마운트하지 않는다.
        if (openedAt !== openCountRef.current) return
        unmount(id)
        ref.current = null
      }

      // key 에 openedAt 을 실어 재오픈이 새 마운트가 되게 한다. id 만으로 키를 잡으면
      // 닫히던 오버레이에 리컨실되어 isOpen 이 false 인 채로 남아 열리지 않는다.
      mount(
        id,
        <OverlayRenderer key={openedAt} ref={ref} element={element} onClose={handleClose} />,
      )

      return requestClose
    },
    [id, mount, requestClose, unmount],
  )

  return useMemo(
    () => ({
      open,
      close: requestClose,
      unmount: () => unmount(id),
    }),
    [id, open, requestClose, unmount],
  )
}

interface OverlayRendererRef {
  close: () => Promise<void>
}

interface OverlayRendererProps {
  element: OverlayElement
  onClose: () => void
  ref?: Ref<OverlayRendererRef>
}

export interface OverlayRenderProps {
  isOpen: boolean
  close: () => Promise<void>
  onClose: () => void
}

type OverlayElement = (controller: OverlayRenderProps) => ReactNode

function OverlayRenderer({ element, onClose, ref }: OverlayRendererProps) {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    startTransition(() => setIsOpen(true))
  }, [])

  const handleClose = usePreservedCallback(onClose)
  const close = useCallback(() => {
    if (!isOpen) return Promise.resolve()

    return new Promise<void>((resolve) => {
      setIsOpen(false)
      // 애니메이션 후 unmount
      setTimeout(() => {
        handleClose()
        resolve()
      }, 300)
    })
  }, [isOpen])

  useImperativeHandle<OverlayRendererRef, OverlayRendererRef>(ref, () => ({ close }), [close])

  return <>{element({ isOpen, close, onClose })}</>
}
