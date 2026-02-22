import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
} from '@mui/material'
import type { Place } from './place.types'
import { PlaceForm, type PlaceFormValues } from './PlaceForm'
import type { ReactNode } from 'react'

interface PlaceFormDialogProps {
  title?: ReactNode;
  place: Place
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: PlaceFormValues) => void
}

export function PlaceFormDialog({ title = '장소 정보', place, isOpen, onClose, onSubmit }: PlaceFormDialogProps) {
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
          defaultValues={place}
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
