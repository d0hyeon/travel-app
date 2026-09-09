import { useCallback, useRef } from 'react'
import { StyleSheet, Linking } from 'react-native'
import { assert } from '@waylog/utility'
import { useTripPlaces } from '@waylog/domains/modules/trip'
import { useConfirmDialog } from '../../../../shared/components/confirm-dialog/useConfirmDialog'
import { BottomSheet } from '../../../../shared/components/bottom-sheet/BottomSheet'
import { Button, Chip, Stack } from '~/shared/components/design-system'
import { useOverlay } from '../../../../shared/hooks/useOverlay'
import { usePlaceDetailOverlay } from '../../../place/place-detail/usePlaceDetailOverlay'
import { PlaceForm, type PlaceFormRef } from './PlaceForm'
import { PlaceTitleButton } from './PlaceTitleButton'
import { PlacePhotoSection } from '../PlacePhotoSection'

interface OpenParams {
  tripId: string
  placeId: string
}

// 웹 useTripPlaceFormOverlay 와 같은 시그니처를 유지한다.
// 저장·삭제는 훅 안에서 끝내고 호출부에는 Promise<void> 만 돌려준다.
// 앱은 화면 분기가 없으므로 시트 하나만 둔다.
export function useTripPlaceFormOverlay() {
  const overlay = useOverlay()

  const openBottomSheet = useCallback(
    ({ tripId, placeId }: OpenParams) => {
      return new Promise<void>((resolve) => {
        overlay.open(({ isOpen, close }) => (
          <PlaceFormSheet
            tripId={tripId}
            placeId={placeId}
            isOpen={isOpen}
            onClose={() => {
              resolve()
              close()
            }}
          />
        ))
      })
    },
    [overlay],
  )

  return { openBottomSheet }
}

interface SheetProps extends OpenParams {
  isOpen: boolean
  onClose: () => void
}

function PlaceFormSheet({ tripId, placeId, isOpen, onClose }: SheetProps) {
  const { data: places, update, remove } = useTripPlaces(tripId)
  const place = places.find((x) => x.id === placeId)
  assert(place != null, '해당 장소가 존재하지 않습니다.')
  const confirm = useConfirmDialog()
  const placeDetail = usePlaceDetailOverlay()
  const formRef = useRef<PlaceFormRef>(null)

  return (
    <BottomSheet
      isOpen={isOpen}
      safeArea
      onDismiss={onClose}
      snapPoints={[0.7]}
      defaultSnapIndex={0}
    >
      <BottomSheet.Header direction="row" justifyContent="space-between">
        <PlaceTitleButton
          name={place.name}
          onPress={() => placeDetail.open(place.placeId)}
        />
        <Button
          variant="outlined"
          color="error"
          size="small"
          onPress={async () => {
            if (await confirm('삭제하시겠습니까?')) {
              await remove(place.id)
              onClose()
            }
          }}
        >
          삭제
        </Button>
      </BottomSheet.Header>
      <BottomSheet.Body style={styles.sheetBody}>
        <Stack direction="row" gap={1} style={styles.header}>
          <Chip label="네이버" variant="outlined" onPress={() => void Linking.openURL(`https://search.naver.com/search.naver?query=${encodeURIComponent(place.name)}`)} />
          <Chip label="인스타" variant="outlined" onPress={() => void Linking.openURL(`https://www.instagram.com/explore/search/keyword/?q=${encodeURIComponent(place.name.replaceAll(' ', ''))}`)} />
          <Chip label="구글" variant="outlined" onPress={() => void Linking.openURL(`https://www.google.com/search?q=${encodeURIComponent(place.name)}`)} />
        </Stack>
        <PlaceForm
          ref={formRef}
          defaultValues={place}
          onSubmit={(data) => {
            void update({ ...data, id: place.id })
            onClose()
          }}
        />
        <PlacePhotoSection tripId={tripId} placeId={place.placeId} />
      </BottomSheet.Body>
      <BottomSheet.BottomActions>
        <Button variant="outlined" fullWidth onPress={onClose}>
          취소
        </Button>
        <Button variant="contained" fullWidth onPress={() => formRef.current?.submit()}>
          저장
        </Button>
      </BottomSheet.BottomActions>
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  sheetBody: { paddingHorizontal: 16 },
  header: { marginBottom: 16 },
})
