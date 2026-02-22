

import { Button, Dialog, DialogContent, DialogTitle, Stack, Typography } from '@mui/material'
import { DraggableBottomSheet } from '../../../shared/components/DraggableBottomSheet'
import { PlaceForm } from '../../place/PlaceForm'
import { useCallback } from 'react';
import { useOverlay } from '../../../shared/hooks/useOverlay';
import { useTripPlaces } from './useTripPlaces';
import { assert } from '../../../shared/lib/assert';

interface PlaceDetailOverlayProps {
  tripId: string;
  placeId: string;
  isOpen: boolean;
  onClose: () => void
}


export function useTripPlaceDetailOverlay() {
  const overlay = useOverlay();

  const openDialog = useCallback((params: Omit<PlaceDetailOverlayProps, 'isOpen' | 'onClose'>) => {
    return new Promise<void>((resolve) => {
      overlay.open(({ close, isOpen }) => (
        <PlaceDetailDialog
          {...params}
          isOpen={isOpen}
          onClose={() => {
            resolve()
            close();
          }}
        />
      ))
    })
  }, []);

  const openBottomSheet = useCallback((params: Omit<PlaceDetailOverlayProps, 'isOpen' | "onClose">) => {
    return new Promise<void>((resolve) => {
      overlay.open(({ close, isOpen }) => (
        <PlaceDetailSheet
          {...params}
          isOpen={isOpen}
          onClose={() => {
            resolve()
            close();
          }}
        />
      ))
    })
  }, []);

  return { openBottomSheet, openDialog }
}




export function PlaceDetailSheet({ placeId, tripId, isOpen, onClose }: PlaceDetailOverlayProps) {
  const { data: places, remove, update } = useTripPlaces(tripId);
  const place = places.find(x => x.id === placeId);

  assert(!!place, '해당 장소가 존재하지 않습니다.')

  return (
    <DraggableBottomSheet
      isOpen={isOpen}
      onClose={onClose}
      snapPoints={[0.6, 0.8]}
      defaultSnapIndex={0}
    >
      <Stack height="100%" sx={{ px: 2, pb: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" paddingRight={2}>
          <Typography variant='h6'>{place.name}</Typography>
          <Button
            type="button"
            variant="outlined"
            color="error"
            size="small"
            onClick={() => {
              remove(place.id);
              onClose();
            }}
          >
            삭제
          </Button>
        </Stack>
        <PlaceForm
          id="place-form"
          defaultValues={place}
          onSubmit={(data) => {
            update({
              placeId: place.id,
              data: {
                ...data,
                category: data.category || undefined,
              },
            })
            onClose()
          }}
          sx={{ flex: '1 1 100%', 'h6': { display: 'none' } }}
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

function PlaceDetailDialog({ tripId, placeId, isOpen, onClose }: PlaceDetailOverlayProps) {
  const { data: places, remove, update } = useTripPlaces(tripId);
  const place = places.find(x => x.id === placeId);

  assert(!!place, '해당 장소가 존재하지 않습니다.')


  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="sm" fullWidth>
      <Stack direction="row" alignItems="center" justifyContent="space-between" paddingRight={2}>
        <DialogTitle>{place.name}</DialogTitle>
        <Button
          type="button"
          variant="contained"
          size="small"
          color="error"
          onClick={() => {
            if (confirm('삭제하시겠습니까?')) {
              remove(place.id);
              onClose();
            }
          }}
        >
          삭제
        </Button>
      </Stack>
      <DialogContent sx={{ pt: 2 }}>
        <PlaceForm
          defaultValues={place}
          onSubmit={(data) => {
            update({
              placeId: place.id,
              data: {
                category: data.category || undefined,
                memo: data.memo,
                tags: data.tags,
              },
            })
            onClose()
          }}
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

