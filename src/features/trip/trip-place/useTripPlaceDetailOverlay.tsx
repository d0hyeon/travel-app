

import { Button, Chip, Dialog, DialogContent, DialogTitle, Stack, Typography } from '@mui/material'
import { DraggableBottomSheet } from '../../../shared/components/DraggableBottomSheet'
import { PlaceForm } from '../../place/PlaceForm'
import { useCallback } from 'react';
import { useOverlay } from '../../../shared/hooks/useOverlay';
import { useTripPlaces } from './useTripPlaces';
import { assert } from '../../../shared/lib/assert';
import { useConfirmDialog } from '~shared/modules/confirm-dialog/useConfirmDialog';

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
            resolve();
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

  assert(!!place, '해당 장소가 존재하지 않습니다.');
  const confirm = useConfirmDialog();

  return (
    <DraggableBottomSheet
      isOpen={isOpen}
      onClose={onClose}
      snapPoints={[0.6, 0.8]}
      defaultSnapIndex={0}
    >
      <Stack position="relative" height="100%" sx={{ pb: 3 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          paddingRight={2}
          position="sticky"
          top={0}
          px={2}
          sx={{ backgroundColor: '#fff' }}
          flex="0 0 auto"
        >
          <Typography variant='h6'>{place.name}</Typography>
          <Button
            type="button"
            variant="outlined"
            color="error"
            size="small"
            onClick={async () => {
              if (await confirm('삭제하시겠습니까?')) {
                onClose();
                setTimeout(() => remove(place.id), 1000)
              }
            }}
          >
            삭제
          </Button>
        </Stack>
        <Stack flex="1 1 100%" px={2} pb={2}>
          <Stack direction="row" mt={1} mb={2} gap={1}>
            <a href={`https://search.naver.com/search.naver?query=${place.name}`} target="_blank">
              <Chip label="네이버" variant="outlined" size="small" sx={{ fontSize: 11 }} />
            </a>
            <a href={`https://www.instagram.com/explore/search/keyword/?q=${place.name.replaceAll(' ', '')}`} target="_blank">
              <Chip label="인스타" variant="outlined" size="small" sx={{ fontSize: 11 }} />
            </a>
            <a href={`https://www.google.com/search?q=${place.name}`} target="_blank">
              <Chip label="구글" variant="outlined" size="small" sx={{ fontSize: 11 }} />
            </a>
          </Stack>
          <PlaceForm
            id="place-form"
            defaultValues={place}
            onSubmit={(data) => {
              console.log(data)
              update({
                ...data,
                placeId: place.id,
                category: data.category || undefined,
              })
              onClose()
            }}
            sx={{ flex: '1 1 100%', 'h6': { display: 'none' } }}
          />
        </Stack>
        <Stack
          width="100%"
          direction="row"
          padding={1}
          gap={1}
          sx={{
            flex: '0 0 auto', position: 'sticky', bottom: 0,
            backgroundColor: '#fff',
            borderTop: `1px solid #ddd`,
            zIndex: 20
          }}
        >
          <Button type="button" variant="outlined" size="large" onClick={onClose} fullWidth>닫기</Button>
          <PlaceForm.SubmitButton size="large" form="place-form" fullWidth />
        </Stack>
      </Stack>
    </DraggableBottomSheet>
  )
}

function PlaceDetailDialog({ tripId, placeId, isOpen, onClose }: PlaceDetailOverlayProps) {
  const { data: places, remove, update } = useTripPlaces(tripId);
  const place = places.find(x => x.id === placeId);

  assert(!!place, '해당 장소가 존재하지 않습니다.')
  const confirm = useConfirmDialog();


  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="sm" fullWidth>
      <Stack direction="row" alignItems="center" justifyContent="space-between" paddingRight={2}>
        <DialogTitle>{place.name}</DialogTitle>
        <Button
          type="button"
          variant="contained"
          size="small"
          color="error"
          onClick={async () => {
            if (await confirm('삭제하시겠습니까?')) {
              onClose();
              setTimeout(() => remove(place.id), 1000)
            }
          }}
        >
          삭제
        </Button>
      </Stack>
      <DialogContent sx={{ paddingTop: 0 }}>
        <Stack direction="row" mb={2} gap={1}>
          <a href={`https://search.naver.com/search.naver?query=${place.name}`} target="_blank">
            <Chip variant="outlined" label="네이버" />
          </a>
          <a href={`https://www.instagram.com/explore/search/keyword/?q=${place.name.replaceAll(' ', '')}`} target="_blank">
            <Chip variant="outlined" label="인스타" />
          </a>
          <a href={`https://www.google.com/search?q=${place.name}`} target="_blank">
            <Chip variant="outlined" label="구글" />
          </a>
        </Stack>
        <PlaceForm
          defaultValues={place}
          onSubmit={async (data) => {
            await update({
              ...data,
              placeId: place.id,
              category: data.category || undefined,
              memo: data.memo,
              tags: data.tags,
            })
            onClose()
          }}
          actions={(
            <Stack direction="row" gap={1} justifyContent="space-between" position="sticky" bottom={0}>
              <Button type="button" onClick={onClose} sx={{ flex: 1 }}>취소</Button>
              <PlaceForm.SubmitButton sx={{ flex: 1 }} />
            </Stack>
          )}
        />
      </DialogContent>
    </Dialog>
  )
}

