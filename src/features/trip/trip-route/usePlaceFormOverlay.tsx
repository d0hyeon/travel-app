import { Button, Dialog, DialogContent, Typography } from "@mui/material";
import { useCallback, type ReactNode } from "react";
import { PlaceForm, type PlaceFormValues } from "~features/place/PlaceForm";
import { BottomArea } from "~shared/components/BottomArea";
import { DraggableBottomSheet } from "~shared/components/DraggableBottomSheet";
import { useOverlay } from "~shared/hooks/useOverlay";
import { DialogTitle } from "~shared/modules/confirm-dialog/DialogTitle";

interface PlaceFormOverlayProps {
  title?: ReactNode;
  defaultValues?: Partial<PlaceFormValues>
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: PlaceFormValues) => void
}

export function usePlaceFormOverlay() {
  const overlay = useOverlay();

  const openDialog = useCallback((props?: Partial<Omit<PlaceFormOverlayProps, 'isOpen'>>) => {
    return new Promise<PlaceFormValues | null>((resolve) => {
      overlay.open(({ isOpen, close }) => (
        <PlaceFormDialog
          {...props}
          isOpen={isOpen}
          onClose={() => {
            props?.onClose?.();
            resolve(null);
            close();
          }}
          onSubmit={(data) => {
            resolve(data);
            props?.onSubmit?.(data);
            close();
          }}

        />
      ))
    })
  }, [])

  const openBottomsheet = useCallback((props?: Partial<Omit<PlaceFormOverlayProps, 'isOpen'>>) => {
    return new Promise<PlaceFormValues | null>((resolve) => {
      overlay.open(({ isOpen, close }) => (
        <PlaceFormSheet
          {...props}
          isOpen={isOpen}
          onClose={() => {
            props?.onClose?.();
            resolve(null);
            close();
          }}
          onSubmit={(data) => {
            resolve(data);
            props?.onSubmit?.(data);
            close();
          }}
        />
      ))
    })
  }, [])

  return { openBottomsheet, openDialog }
}

function PlaceFormSheet({ title = '장소 정보', defaultValues, isOpen, onClose, onSubmit }: PlaceFormOverlayProps) {
  const handleSubmit = (data: PlaceFormValues) => {
    onSubmit(data)
    onClose()
  }

  return (
    <DraggableBottomSheet
      isOpen={isOpen}
      onClose={onClose}
      snapPoints={[0.6, 0.8]}
      defaultSnapIndex={0}
    >
      {typeof title === 'string' ? (
        <Typography paddingX={2} variant="h6">{title}</Typography>
      ) : title}
      <PlaceForm
        id="place-form"
        defaultValues={defaultValues}
        onSubmit={handleSubmit}
        paddingBottom={4}
        paddingX={2}
      />

      <BottomArea position="absolute" marginTop={2} paddingBottom={2}>
        <Button type="button" onClick={onClose} size="large" variant="outlined" sx={{ flex: 1 }}>닫기</Button>
        <PlaceForm.SubmitButton form="place-form" size="large" sx={{ flex: 1 }} />
      </BottomArea>

    </DraggableBottomSheet>
  )
}


function PlaceFormDialog({ title = '장소 정보', defaultValues, isOpen, onClose, onSubmit }: PlaceFormOverlayProps) {
  const handleSubmit = (data: PlaceFormValues) => {
    onSubmit(data)
    onClose()
  }

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="sm" fullWidth>
      {typeof title === 'string' ? (
        <DialogTitle>{title}</DialogTitle>
      ) : title}

      <DialogContent sx={{ pt: 2 }}>
        <PlaceForm
          defaultValues={defaultValues}
          onSubmit={handleSubmit}
          actions={(
            <>
              <Button type="button" onClick={onClose} sx={{ flex: 1 }}>취소</Button>
              <PlaceForm.SubmitButton sx={{ flex: 1 }} />
            </>
          )}
        />
      </DialogContent>
    </Dialog>
  )
}
