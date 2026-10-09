import CloseIcon from '@mui/icons-material/Close'
import { Button, Dialog, DialogActions, DialogContent, IconButton, Stack } from '@mui/material'
import { useCallback, useId } from 'react'
import { usePlaceDetailOverlay } from '~features/place/place-detail/usePlaceDetailOverlay'
import { PlaceTitleButton } from '~features/trip/trip-place/trip-place-form/PlaceTitleButton'
import { BottomSheet } from '~shared/components/bottom-sheet/BottomSheet'
import { useOverlay } from '~shared/hooks/useOverlay'
import { RoutePlaceEditBody } from './RoutePlaceEditBody'
import { RoutePlaceRemoveButton } from './RoutePlaceRemoveButton'
import { useRoutePlaceEditForm } from './useRoutePlaceEditForm'

interface OpenParams {
  tripId: string
  routeId: string
  placeId: string
}

interface OverlayProps extends OpenParams {
  isOpen: boolean
  onClose: () => void
}

export function useRoutePlaceEditOverlay() {
  const overlay = useOverlay()

  const openBottomsheet = useCallback((params: OpenParams) => {
    return new Promise<void>((resolve) => {
      overlay.open(({ isOpen, close }) => (
        <RoutePlaceEditSheet
          {...params}
          isOpen={isOpen}
          onClose={() => {
            resolve()
            close()
          }}
        />
      ))
    })
  }, [overlay])

  const openDialog = useCallback((params: OpenParams) => {
    return new Promise<void>((resolve) => {
      overlay.open(({ isOpen, close }) => (
        <RoutePlaceEditDialog
          {...params}
          isOpen={isOpen}
          onClose={() => {
            resolve()
            close()
          }}
        />
      ))
    })
  }, [overlay])

  return { openBottomsheet, openDialog }
}

function RoutePlaceEditSheet({ tripId, routeId, placeId, isOpen, onClose }: OverlayProps) {
  const formId = useId()
  const form = useRoutePlaceEditForm({ tripId, routeId, placeId, onSaved: onClose })
  const placeDetail = usePlaceDetailOverlay()

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <BottomSheet.Header direction="row" justifyContent="space-between">
        <PlaceTitleButton name={form.place.name} onClick={() => placeDetail.open(form.place.placeId)} />
        <RoutePlaceRemoveButton tripId={tripId} routeId={routeId} placeId={placeId} onRemoved={onClose} />
      </BottomSheet.Header>
      <BottomSheet.Body>
        <RoutePlaceEditBody formId={formId} form={form} />
      </BottomSheet.Body>
      <BottomSheet.BottomActions>
        <Stack direction="row" gap={1} width="100%">
          <Button type="button" variant="outlined" size="large" onClick={onClose} fullWidth>취소</Button>
          <Button type="submit" form={formId} variant="contained" size="large" loading={form.isSubmitting} fullWidth>저장</Button>
        </Stack>
      </BottomSheet.BottomActions>
    </BottomSheet>
  )
}

function RoutePlaceEditDialog({ tripId, routeId, placeId, isOpen, onClose }: OverlayProps) {
  const formId = useId()
  const form = useRoutePlaceEditForm({ tripId, routeId, placeId, onSaved: onClose })
  const placeDetail = usePlaceDetailOverlay()

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth={false}
      fullWidth
      slotProps={{ paper: { sx: { maxWidth: 560, borderRadius: '20px' } } }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" paddingX={4} paddingTop={3.5} paddingBottom={2}>
        <PlaceTitleButton name={form.place.name} onClick={() => placeDetail.open(form.place.placeId)} />
        <Stack direction="row" alignItems="center" gap={1}>
          <RoutePlaceRemoveButton tripId={tripId} routeId={routeId} placeId={placeId} onRemoved={onClose} />
          <IconButton size="small" aria-label="닫기" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Stack>
      </Stack>
      <DialogContent sx={{ paddingX: 4, paddingTop: 0 }}>
        <RoutePlaceEditBody formId={formId} form={form} />
      </DialogContent>
      <DialogActions sx={{ paddingX: 4, paddingTop: 2.5, paddingBottom: 3.5, gap: 1, '& .MuiButton-root': { height: 44, paddingX: 2.75, borderRadius: '10px', fontWeight: 700 } }}>
        <Button type="button" variant="outlined" color="inherit" onClick={onClose}>취소</Button>
        <Button type="submit" form={formId} variant="contained" loading={form.isSubmitting}>저장</Button>
      </DialogActions>
    </Dialog>
  )
}
