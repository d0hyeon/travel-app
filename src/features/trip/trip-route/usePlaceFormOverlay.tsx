import { Button, Chip, Dialog, DialogActions, DialogContent, Stack, Typography } from "@mui/material";
import { useCallback, useId, type ReactNode } from "react";
import { PlaceForm, type PlaceFormValues } from "~features/place/PlaceForm";
import { BottomSheet } from "~shared/components/BottomSheet";
import { useOverlay } from "~shared/hooks/useOverlay";
import { DialogTitle } from "~shared/components/confirm-dialog/DialogTitle";
import { useTripPlaces } from "../trip-place/useTripPlaces";
import { assert } from "~shared/utils/assert";
import { PlacePhotoSection } from "~features/trip/trip-place/PlacePhotoSection";

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

  const openBottomsheet = useCallback((props: Omit<PlaceFormSheetProps, 'isOpen'>) => {
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


interface PlaceFormSheetProps extends PlaceFormOverlayProps {
  header?: (props: { onClose?: () => void; }) => ReactNode;
}

function PlaceFormSheet({
  placeId,
  tripId,
  title = '장소 정보',
  header,
  defaultValues,
  isOpen,
  onClose,
  onSubmit
}: PlaceFormSheetProps) {
  const formId = useId();
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
      {header != null ? (
        <>{header({ onClose })}</>
      ) : title != null ?
        <BottomSheet.Header>
          <Typography variant="h6">{title}</Typography>
        </BottomSheet.Header>
        : null}
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
          id={formId}
          defaultValues={defaultValues}
          onSubmit={handleSubmit}
        />
        <PlacePhotoSection placeId={placeId} tripId={tripId} />
      </BottomSheet.Body>
      <BottomSheet.BottomActions>
        <Button type="button" onClick={onClose} size="large" variant="outlined" fullWidth >닫기</Button>
        <PlaceForm.SubmitButton form={formId} size="large" fullWidth />
      </BottomSheet.BottomActions>
    </BottomSheet>
  )
}


function PlaceFormDialog({ tripId, placeId, title = '장소 정보', defaultValues, isOpen, onClose, onSubmit }: PlaceFormOverlayProps) {
  const formId = useId();
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
          id={formId}
          defaultValues={defaultValues}
          onSubmit={handleSubmit}
        />
        <PlacePhotoSection placeId={placeId} tripId={tripId} />
      </DialogContent>
      <DialogActions>
        <Button type="button" onClick={onClose}>취소</Button>
        <PlaceForm.SubmitButton form={formId} />
      </DialogActions>
    </Dialog>
  )
}
