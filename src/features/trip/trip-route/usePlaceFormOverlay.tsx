import { Button, Chip, Dialog, DialogContent, Stack, Typography } from "@mui/material";
import { useCallback, type ReactNode } from "react";
import { PlaceForm, type PlaceFormValues } from "~features/place/PlaceForm";
import { BottomSheet } from "~shared/components/BottomSheet";
import { useOverlay } from "~shared/hooks/useOverlay";
import { DialogTitle } from "~shared/modules/confirm-dialog/DialogTitle";
import { useTripPlaces } from "../trip-place/useTripPlaces";
import { assert } from "~shared/lib/assert";

interface PlaceFormOverlayProps {
  placeId: string;
  tripId: string;
  title?: ReactNode;
  defaultValues?: Partial<PlaceFormValues>
  isOpen: boolean
  onClose?: () => void
  onSubmit?: (data: PlaceFormValues) => void
}

export function usePlaceFormOverlay() {
  const overlay = useOverlay();

  const openDialog = useCallback((props: Omit<PlaceFormOverlayProps, 'isOpen'>) => {
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

  const openBottomsheet = useCallback((props: Omit<PlaceFormOverlayProps, 'isOpen'>) => {
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

function PlaceFormSheet({ placeId, tripId, title = '장소 정보', defaultValues, isOpen, onClose, onSubmit }: PlaceFormOverlayProps) {
  const { data: places } = useTripPlaces(tripId);
  const place = places.find(x => x.id === placeId);
  assert(!!place, '존재하지 않는 장소입니다.');

  const handleSubmit = (data: PlaceFormValues) => {
    onSubmit?.(data)
    onClose?.()
  }

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
    >
      <BottomSheet.Header>
        {typeof title === 'string' ? (
          <Typography variant="h6">{title}</Typography>
        ) : title}
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
          defaultValues={defaultValues}
          onSubmit={handleSubmit}
        />
      </BottomSheet.Body>
      <BottomSheet.BottomActions>
        <Stack direction="row" gap={1}>
          <Button type="button" onClick={onClose} size="large" variant="outlined" sx={{ flex: 1 }}>닫기</Button>
          <PlaceForm.SubmitButton form="place-form" size="large" sx={{ flex: 1 }} />
        </Stack>
      </BottomSheet.BottomActions>
    </BottomSheet>
  )
}


function PlaceFormDialog({ tripId, placeId, title = '장소 정보', defaultValues, isOpen, onClose, onSubmit }: PlaceFormOverlayProps) {
  const { data: places } = useTripPlaces(tripId);
  const place = places.find(x => x.id === placeId);
  assert(!!place, '존재하지 않는 장소입니다.');

  const handleSubmit = (data: PlaceFormValues) => {
    onSubmit?.(data)
    onClose?.()
  }

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="sm" fullWidth>
      {typeof title === 'string' ? (
        <DialogTitle>{title}</DialogTitle>
      ) : title}

      <DialogContent sx={{ paddingTop: '0px !important' }}>
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
