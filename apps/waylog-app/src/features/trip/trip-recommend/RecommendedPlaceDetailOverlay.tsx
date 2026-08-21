import { useAddTripPlace } from '@waylog/domains/trip'
import type { RecommendedPlace } from '@waylog/domains/trip-recommend'
import { Suspense, useCallback } from 'react'
import { ActivityIndicator } from 'react-native'
import { BottomSheet } from '../../../shared/components/bottom-sheet/BottomSheet'
import { Button, Stack, Typography } from '../../../shared/components/mui'
import { useOverlay } from '../../../shared/hooks/useOverlay'
import { PlaceDetailBody } from '../../place/place-detail/PlaceDetailSheet'

interface Props {
  place: RecommendedPlace
  tripId: string
  isOpen: boolean
  onClose: () => void
}

// 웹은 모바일에서 openBottomSheet, 데스크톱에서 openDialog 를 쓴다.
// 앱은 시트만 있으므로 openBottomSheet 만 노출한다.
export function useRecommendedPlaceDetailOverlay() {
  const overlay = useOverlay()

  const openBottomSheet = useCallback(
    (params: Omit<Props, 'isOpen' | 'onClose'>) => {
      overlay.open(({ close, isOpen }) => (
        <RecommendedPlaceDetailSheet {...params} isOpen={isOpen} onClose={close} />
      ))
    },
    [overlay],
  )

  return { openBottomSheet }
}

function RecommendedPlaceDetailSheet({ place, tripId, isOpen, onClose }: Props) {
  const { mutateAsync: create, isPending: isAdding } = useAddTripPlace(tripId, {
    onSuccess: () => onClose(),
  })

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <BottomSheet.Header>
        <Typography variant="h6">{place.name}</Typography>
      </BottomSheet.Header>
      <BottomSheet.Body>
        <Suspense fallback={<ActivityIndicator />}>
          <PlaceDetailBody placeId={place.id} />
        </Suspense>
      </BottomSheet.Body>
      <BottomSheet.BottomActions>
        <Stack direction="row" gap={1}>
          <Button fullWidth variant="outlined" size="large" onClick={onClose}>
            닫기
          </Button>
          <Button
            fullWidth
            variant="contained"
            size="large"
            disabled={isAdding}
            onClick={() => create(place)}
          >
            장소에 담기
          </Button>
        </Stack>
      </BottomSheet.BottomActions>
    </BottomSheet>
  )
}
