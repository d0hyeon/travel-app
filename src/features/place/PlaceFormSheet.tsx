import { Button, Stack, Typography } from '@mui/material'
import type { Place } from './place.types'
import { DraggableBottomSheet } from '../../shared/components/DraggableBottomSheet'
import { PlaceForm, type PlaceFormValues } from './PlaceForm'
import type { ReactNode } from 'react'

interface PlaceFormSheetProps {
  title?: ReactNode;
  place: Place
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: PlaceFormValues) => void
  onDelete?: () => void
}

export function PlaceFormSheet({ title = '장소 정보', place, isOpen, onClose, onSubmit }: PlaceFormSheetProps) {
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
      <Stack height="100%" sx={{ px: 2, pb: 3 }}>
        {typeof title === 'string' ? (
          <Typography variant="h6">{title}</Typography>
        ) : title}
        <PlaceForm
          id="place-form"
          defaultValues={place}
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
