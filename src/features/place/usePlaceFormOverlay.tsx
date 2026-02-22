
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Stack, Typography,
} from '@mui/material'
import { useCallback, type ReactNode } from 'react'
import { DraggableBottomSheet } from '../../shared/components/DraggableBottomSheet'
import type { Place } from './place.types'
import { PlaceForm, type PlaceFormValues } from './PlaceForm'
import { useOverlay } from '../../shared/hooks/useOverlay'

interface PlaceFormOverlayProps {
  title?: ReactNode;
  defaultValue?: Place
  isOpen: boolean
  onClose?: () => void
  onSubmit?: (data: PlaceFormValues) => void
}


export function usePlaceFormOverlay() {
  const overlay = useOverlay();

  const openDialog = useCallback((props?: Omit<PlaceFormOverlayProps, 'isOpen'>) => {
    return new Promise<PlaceFormValues | null>(resolve => {
      overlay.open(({ isOpen, close }) => {
        return (
          <PlaceFormDialog
            {...props}
            isOpen={isOpen}
            onSubmit={(data) => {
              props?.onSubmit?.(data);
              resolve(data);
              close();
            }}
            onClose={() => {
              props?.onClose?.();
              resolve(null);
              close();
            }}
          />
        )
      })
    })
  }, [])

  const openBottomSheet = useCallback((props?: Omit<PlaceFormOverlayProps, 'isOpen'>) => {
    return new Promise<PlaceFormValues | null>(resolve => {
      overlay.open(({ isOpen, close }) => {
        return (
          <PlaceFormSheet
            {...props}
            isOpen={isOpen}
            onSubmit={(data) => {
              props?.onSubmit?.(data);
              resolve(data);
              close();
            }}
            onClose={() => {
              props?.onClose?.();
              resolve(null);
              close();
            }}
          />
        )
      })
    })
  }, []);

  return { openBottomSheet, openDialog }
}


export function PlaceFormDialog({ title = '장소 정보', defaultValue, isOpen, onClose, onSubmit }: PlaceFormOverlayProps) {
  const handleSubmit = (data: PlaceFormValues) => {
    onSubmit?.(data)
    onClose?.()
  }

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="sm" fullWidth>
      {typeof title === 'string' ? (
        <DialogTitle>{title}</DialogTitle>
      ) : title}

      <DialogContent sx={{ pt: 2 }}>
        <PlaceForm
          defaultValues={defaultValue}
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



export function PlaceFormSheet({ title = '장소 정보', defaultValue, isOpen, onClose, onSubmit }: PlaceFormOverlayProps) {
  const handleSubmit = (data: PlaceFormValues) => {
    onSubmit?.(data)
    onClose?.()
  }

  return (
    <DraggableBottomSheet
      isOpen={isOpen}
      onClose={onClose}
      snapPoints={[0.6, 0.8]}
      defaultSnapIndex={0}
    >
      <Stack height="100%" sx={{ px: 2, pb: 3 }}>
        {typeof title === 'string' ? (
          <Typography variant="h6">{title}</Typography>
        ) : title}
        <PlaceForm
          id="place-form"
          defaultValues={defaultValue}
          onSubmit={handleSubmit}
          sx={{ flex: '1 1 100%' }}
          height="100%"
        />

        <Stack width="100%" direction="row" padding={1} sx={{ flex: '0 0 auto' }}>
          <Button type="button" onClick={onClose} sx={{ flex: 1 }}>닫기</Button>
          <PlaceForm.SubmitButton form="place-form" sx={{ flex: 1 }} />
        </Stack>

      </Stack>
    </DraggableBottomSheet>
  )
}
