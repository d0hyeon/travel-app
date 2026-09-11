import { useAddTripPlace, useTripPlaces } from '@waylog/domains/modules/trip'
import type { RecommendedPlace } from '@waylog/domains/modules/trip-recommend'
import { Suspense, useCallback, useTransition } from 'react'
import { StyleSheet, ActivityIndicator } from 'react-native'
import { BottomSheet } from '../../../shared/components/bottom-sheet/BottomSheet'
import { Button, Stack, Typography } from '~/shared/components/design-system'
import { useOverlay } from '../../../shared/hooks/useOverlay'
import { PlaceDetailBody } from '../../place/place-detail/PlaceDetailSheet'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQueryClient } from '@tanstack/react-query'
import { useLoading } from '@waylog/react'

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
  const queryClient = useQueryClient();
  const { mutateAsync: create } = useAddTripPlace(tripId)
  const [isPending, startTransition] = useLoading();



  return (
    <BottomSheet isOpen={isOpen} safeArea onDismiss={onClose}>
      <BottomSheet.Header>
        <Typography variant="h6">{place.name}</Typography>
      </BottomSheet.Header>
      <BottomSheet.Body style={styles.recommendedPlaceDetailSheetBody}>
        <Suspense fallback={<ActivityIndicator />}>
          <PlaceDetailBody placeId={place.id} />
        </Suspense>
      </BottomSheet.Body>
      <BottomSheet.BottomActions>
        <Button fullWidth variant="outlined" size="large" onPress={onClose}>
          닫기
        </Button>
        <Button
          fullWidth
          variant="contained"
          size="large"
          loading={isPending}
          onPress={() => {
            startTransition(async () => {
              await create(place);
              await queryClient.invalidateQueries({
                queryKey: useTripPlaces.key(tripId)
              })
              onClose();
            })
          }}
        >
          장소에 담기
        </Button>
      </BottomSheet.BottomActions>
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  recommendedPlaceDetailSheetBody: { paddingHorizontal: 16 },
})
