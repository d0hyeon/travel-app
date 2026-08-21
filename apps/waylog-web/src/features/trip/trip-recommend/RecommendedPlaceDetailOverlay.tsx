import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  type ButtonProps
} from '@mui/material'
import { useCallback } from 'react'
import { PlaceInfoWidget } from '~features/place/PlaceInfoWIdget'
import { BottomSheet } from '../../../shared/components/bottom-sheet/BottomSheet'
import { useOverlay } from '../../../shared/hooks/useOverlay'
import { useAddTripPlace } from '@waylog/domains/trip'
import type { RecommendedPlace } from '@waylog/domains/trip-recommend'

interface Props {
  place: RecommendedPlace
  tripId: string
  isOpen: boolean
  onClose: () => void
}

export function useRecommendedPlaceDetailOverlay() {
  const overlay = useOverlay()

  const openDialog = useCallback(
    (params: Omit<Props, 'isOpen' | 'onClose'>) => {
      overlay.open(({ close, isOpen }) => (
        <RecommendedPlaceDetailDialog {...params} isOpen={isOpen} onClose={close} />
      ))
    },
    [overlay],
  )

  const openBottomSheet = useCallback(
    (params: Omit<Props, 'isOpen' | 'onClose'>) => {
      overlay.open(({ close, isOpen }) => (
        <RecommendedPlaceDetailSheet {...params} isOpen={isOpen} onClose={close} />
      ))
    },
    [overlay],
  )

  return { openDialog, openBottomSheet }
}



function RecommendedPlaceDetailSheet({ place, tripId, isOpen, onClose }: Props) {
  const { mutateAsync: create, isPending: isAdding } = useAddTripPlace(tripId, {
    onSuccess: () => onClose(),
  });

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <BottomSheet.Header>
        <Typography variant="h6">{place.name}</Typography>
      </BottomSheet.Header>
      <BottomSheet.Body>
        <BottomSheet.Scrollable>
          <PlaceInfoWidget placeId={place.id} />
        </BottomSheet.Scrollable>
      </BottomSheet.Body>
      <BottomSheet.BottomActions>
        <Button variant="outlined" size="large" onClick={onClose} fullWidth>
          닫기
        </Button>
        <AddPlaceButton loading={isAdding} onClick={() => create(place)} fullWidth size="large" />
      </BottomSheet.BottomActions>
    </BottomSheet>
  )
}

function RecommendedPlaceDetailDialog({ place, tripId, isOpen, onClose }: Props) {
  const { mutateAsync: create, isPending: isAdding } = useAddTripPlace(tripId, {
    onSuccess: () => onClose(),
  });

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{place.name}</DialogTitle>
      <DialogContent>
        <PlaceInfoWidget placeId={place.id} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>닫기</Button>
        <AddPlaceButton loading={isAdding} onClick={() => create(place)} />
      </DialogActions>
    </Dialog>
  )
}


function AddPlaceButton(props: ButtonProps) {
  return (
    <Button
      variant="contained"
      sx={{ whiteSpace: 'nowrap' }}
      {...props}
    >
      장소에 담기
    </Button>
  )
}