import { useCallback, useRef } from 'react'
import { Linking } from 'react-native'
import { assert } from '@waylog/utility'
import { useTripPlaces } from '@waylog/domains/modules/trip'
import { useConfirmDialog } from '../../../shared/components/confirm-dialog/useConfirmDialog'
import { BottomSheet } from '../../../shared/components/bottom-sheet/BottomSheet'
import { Button, Chip, Stack } from '../../../shared/components/mui'
import { useOverlay } from '../../../shared/hooks/useOverlay'
import { usePlaceDetailOverlay } from '../../place/place-detail/usePlaceDetailOverlay'
import { PlaceForm, type PlaceFormRef, type PlaceFormValues } from '../trip-place/trip-place-form/PlaceForm'
import { PlaceTitleButton } from '../trip-place/trip-place-form/PlaceTitleButton'
import { PlacePhotoSection } from '../trip-place/PlacePhotoSection'

interface OpenParams {
  tripId: string
  placeId: string
  onDelete?: () => void
}

// 웹 usePlaceFormOverlay 와 같은 시그니처를 유지한다.
// 앱은 화면 분기가 없으므로 시트 하나만 둔다.
export function usePlaceFormOverlay() {
  const overlay = useOverlay()

  const openBottomsheet = useCallback(
    ({ tripId, placeId, onDelete }: OpenParams) => {
      return new Promise<PlaceFormValues | null>((resolve) => {
        overlay.open(({ isOpen, close }) => (
          <PlaceFormSheet
            tripId={tripId}
            placeId={placeId}
            isOpen={isOpen}
            onDelete={onDelete}
            onSubmit={(data) => {
              resolve(data)
              close()
            }}
            onDismiss={() => {
              resolve(null)
              close()
            }}
          />
        ))
      })
    },
    [overlay],
  )

  return { openBottomsheet }
}

interface SheetProps {
  tripId: string
  placeId: string
  isOpen: boolean
  onDelete?: () => void
  onSubmit: (data: PlaceFormValues) => void
  onDismiss: () => void
}

function PlaceFormSheet({ tripId, placeId, isOpen, onDelete, onSubmit, onDismiss }: SheetProps) {
  const { data: places } = useTripPlaces(tripId)
  const place = places.find((x) => x.id === placeId)
  assert(place != null, '존재하지 않는 장소입니다.')
  const confirm = useConfirmDialog()
  const placeDetail = usePlaceDetailOverlay()
  const formRef = useRef<PlaceFormRef>(null)

  return (
    <BottomSheet isOpen={isOpen} safeArea onDismiss={onDismiss} snapPoints={[0.7]} defaultSnapIndex={0}>
      <BottomSheet.Header direction="row" justifyContent="space-between">
        <PlaceTitleButton
          name={place.name}
          onClick={() => placeDetail.open(place.placeId)}
        />
        <Button
          variant="outlined"
          color="error"
          size="small"
          onClick={async () => {
            if (await confirm('삭제하시겠습니까?')) {
              onDelete?.()
              onDismiss()
            }
          }}
        >
          삭제
        </Button>
      </BottomSheet.Header>
      <BottomSheet.Body sx={{ paddingHorizontal: 16 }}>
        <Stack direction="row" gap={1} sx={{ marginBottom: 16 }}>
          <Chip label="네이버" variant="outlined" onClick={() => void Linking.openURL(`https://search.naver.com/search.naver?query=${encodeURIComponent(place.name)}`)} />
          <Chip label="인스타" variant="outlined" onClick={() => void Linking.openURL(`https://www.instagram.com/explore/search/keyword/?q=${encodeURIComponent(place.name.replaceAll(' ', ''))}`)} />
          <Chip label="구글" variant="outlined" onClick={() => void Linking.openURL(`https://www.google.com/search?q=${encodeURIComponent(place.name)}`)} />
        </Stack>
        <PlaceForm ref={formRef} defaultValues={place} onSubmit={onSubmit} />
        <PlacePhotoSection tripId={tripId} placeId={place.placeId} />
      </BottomSheet.Body>
      <BottomSheet.BottomActions>
        <Button variant="outlined" fullWidth onClick={onDismiss}>
          취소
        </Button>
        <Button variant="contained" fullWidth onClick={() => formRef.current?.submit()}>
          저장
        </Button>
      </BottomSheet.BottomActions>
    </BottomSheet>
  )
}
