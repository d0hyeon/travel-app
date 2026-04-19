import AddIcon from '@mui/icons-material/Add'
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material'
import { useMutation } from '@tanstack/react-query'
import { Suspense, useCallback } from 'react'
import { queryClient } from '~app/query-client'
import { BottomSheet } from '../../../shared/components/bottom-sheet/BottomSheet'
import { Map } from '../../../shared/components/Map'
import { useOverlay } from '../../../shared/hooks/useOverlay'
import { createPlace } from '../../place/place.api'
import type { RecommendedPlace } from '../../place/recommended-place.api'
import { useTrip } from '../useTrip'
import { useTripPlaces } from './useTripPlaces'

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

function AddPlaceButton({
  place,
  tripId,
  onClose,
}: {
  place: RecommendedPlace
  tripId: string
  onClose: () => void
}) {
  const { mutateAsync, isPending } = useMutation({
    mutationFn: () =>
      createPlace({
        tripId,
        name: place.name,
        address: place.address,
        lat: place.lat,
        lng: place.lng,
        category: place.category,
        memo: '',
        tags: [],
        status: 'wished',
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: useTripPlaces.key(tripId) }),
  })

  return (
    <Button
      variant="contained"
      startIcon={<AddIcon />}
      disabled={isPending}
      onClick={async () => {
        await mutateAsync()
        onClose()
      }}
    >
      추가하기
    </Button>
  )
}

function PlaceMapPreview({ place, tripId }: { place: RecommendedPlace; tripId: string }) {
  const { data: trip } = useTrip(tripId)
  const mapType = trip.isOverseas ? 'google' : 'kakao'

  return (
    <Box sx={{ height: 200, borderRadius: 1, overflow: 'hidden' }}>
      <Map type={mapType} center={{ lat: place.lat, lng: place.lng }} height="100%">
        <Map.Marker lat={place.lat} lng={place.lng} label={place.name} />
      </Map>
    </Box>
  )
}

function PlaceDetailBody({ place, tripId }: { place: RecommendedPlace; tripId: string }) {
  return (
    <Stack spacing={2}>
      <Suspense
        fallback={
          <Box
            sx={{ height: 200, borderRadius: 1, bgcolor: 'grey.100', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <CircularProgress size={24} />
          </Box>
        }
      >
        <PlaceMapPreview place={place} tripId={tripId} />
      </Suspense>

      {place.address && (
        <Typography variant="body2" color="text.secondary">
          {place.address}
        </Typography>
      )}

      {place.photos.length > 0 && (
        <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 0.5 }}>
          {place.photos.map((url, i) => (
            <Box
              key={i}
              component="img"
              src={url}
              sx={{ width: 100, height: 80, objectFit: 'cover', borderRadius: 1, flexShrink: 0 }}
            />
          ))}
        </Stack>
      )}
    </Stack>
  )
}

function RecommendedPlaceDetailSheet({ place, tripId, isOpen, onClose }: Props) {
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <BottomSheet.Header>
        <Typography variant="h6">{place.name}</Typography>
      </BottomSheet.Header>
      <BottomSheet.Body>
        <PlaceDetailBody place={place} tripId={tripId} />
      </BottomSheet.Body>
      <BottomSheet.BottomActions>
        <Button variant="outlined" size="large" onClick={onClose} fullWidth>
          닫기
        </Button>
        <AddPlaceButton place={place} tripId={tripId} onClose={onClose} />
      </BottomSheet.BottomActions>
    </BottomSheet>
  )
}

function RecommendedPlaceDetailDialog({ place, tripId, isOpen, onClose }: Props) {
  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{place.name}</DialogTitle>
      <DialogContent>
        <PlaceDetailBody place={place} tripId={tripId} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>닫기</Button>
        <AddPlaceButton place={place} tripId={tripId} onClose={onClose} />
      </DialogActions>
    </Dialog>
  )
}
