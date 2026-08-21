import { useCallback } from 'react'
import { useOverlay } from '../../hooks/useOverlay'
import ConfirmDialog, { type ConfirmDialogProps } from './ConfirmDialog'

// 웹 useConfirmDialog 와 같은 시그니처를 유지한다.
export function useConfirmDialog() {
  const overlay = useOverlay()

  return useCallback(
    (title: string, props?: Omit<ConfirmDialogProps, 'isOpen' | 'title' | 'onConfirm' | 'onCancel'>) => {
      return new Promise<boolean>((resolve) => {
        overlay.open(({ isOpen, close }) => (
          <ConfirmDialog
            {...props}
            isOpen={isOpen}
            title={title}
            onCancel={() => {
              resolve(false)
              close()
            }}
            onConfirm={() => {
              resolve(true)
              close()
            }}
          />
        ))
      })
    },
    [overlay],
  )
}
