

import { Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Stack } from '@mui/material'
import { BottomSheet } from '../../../../shared/components/bottom-sheet/BottomSheet'
import { PlaceForm } from './PlaceForm'
import { PlaceTitleButton } from './PlaceTitleButton'
import { useCallback } from 'react';
import { useOverlay } from '../../../../shared/hooks/useOverlay';
import { useTripPlaces } from '../useTripPlaces';
import { assert } from '~shared/utils/types';
import { useConfirmDialog } from '~shared/components/confirm-dialog/useConfirmDialog';
import { usePlaceDetailOverlay } from '~features/place/place-detail/usePlaceDetailOverlay';
import { PlacePhotoSection } from '../PlacePhotoSection';

interface PlaceFormOverlayProps {
  tripId: string;
  placeId: string;
  isOpen: boolean;
  onClose: () => void
}


export function useTripPlaceFormOverlay() {
  const overlay = useOverlay();

  const openDialog = useCallback((params: Omit<PlaceFormOverlayProps, 'isOpen' | 'onClose'>) => {
    return new Promise<void>((resolve) => {
      overlay.open(({ close, isOpen }) => (
        <PlaceFormDialog
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

  const openBottomSheet = useCallback((params: Omit<PlaceFormOverlayProps, 'isOpen' | "onClose">) => {
    return new Promise<void>((resolve) => {
      overlay.open(({ close, isOpen }) => (
        <PlaceFormSheet
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




export function PlaceFormSheet({ placeId, tripId, isOpen, onClose }: PlaceFormOverlayProps) {
  const { data: places, remove, update } = useTripPlaces(tripId);
  const place = places.find(x => x.id === placeId);

  assert(!!place, '해당 장소가 존재하지 않습니다.');
  const confirm = useConfirmDialog();
  const placeDetail = usePlaceDetailOverlay();

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
    >
      <BottomSheet.Header direction="row" justifyContent="space-between">
        <PlaceTitleButton name={place.name} onClick={() => placeDetail.open(place.placeId)} />
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
      </BottomSheet.Header>
      <BottomSheet.Body>
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
            update({
              ...data,
              id: place.id,
            })
            onClose()
          }}
          sx={{ 'h6': { display: 'none' } }}
        />
        <PlacePhotoSection tripId={tripId} placeId={place.placeId} />
      </BottomSheet.Body>
      <BottomSheet.BottomActions>
        <Stack direction="row" gap={1} width="100%">
          <Button type="button" variant="outlined" size="large" onClick={onClose} fullWidth>닫기</Button>
          <PlaceForm.SubmitButton size="large" form="place-form" fullWidth />
        </Stack>
      </BottomSheet.BottomActions>
    </BottomSheet>
  )
}

function PlaceFormDialog({ tripId, placeId, isOpen, onClose }: PlaceFormOverlayProps) {
  const { data: places, remove, update } = useTripPlaces(tripId);
  const place = places.find(x => x.id === placeId);

  assert(!!place, '해당 장소가 존재하지 않습니다.')
  const confirm = useConfirmDialog();
  const placeDetail = usePlaceDetailOverlay();


  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="sm" fullWidth>
      <Stack direction="row" alignItems="center" justifyContent="space-between" paddingRight={2}>
        <DialogTitle>
          <PlaceTitleButton name={place.name} onClick={() => placeDetail.open(place.placeId)} />
        </DialogTitle>
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
          id="place-form-dialog"
          defaultValues={place}
          onSubmit={async (data) => {
            await update({
              ...data,
              id: place.id,
            })
            onClose()
          }}
        />
        <PlacePhotoSection tripId={tripId} placeId={place.placeId} />
      </DialogContent>
      <DialogActions>
        <Button type="button" onClick={onClose}>취소</Button>
        <PlaceForm.SubmitButton form="place-form-dialog" />
      </DialogActions>
    </Dialog>
  )
}

