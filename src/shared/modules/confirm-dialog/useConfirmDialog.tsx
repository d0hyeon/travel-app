import { useCallback } from "react";
import { useOverlay } from "~shared/hooks/useOverlay";
import ConfirmDialog, { type ConfirmDialogProps } from "./ConfirmDialog";

export function useConfirmDialog() {
  const overlay = useOverlay();

  return useCallback((title: string, props?: Omit<ConfirmDialogProps, 'isOpen'>) => {
    return new Promise<boolean>((resolve) => {
      overlay.open(({ isOpen, close }) => (
        <ConfirmDialog
          {...props}
          isOpen={isOpen}
          title={title}
          onCancel={() => {
            props?.onCancel?.();
            resolve(false)
            close();
          }}
          onConfirm={() => {
            props?.onConfirm?.();
            resolve(true)
            close();
          }}
        />
      ))
    })
  }, [])
}