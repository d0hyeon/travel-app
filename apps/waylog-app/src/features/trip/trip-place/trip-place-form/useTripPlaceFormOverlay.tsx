import { useCallback } from 'react'
import { useTripPlaces } from '@waylog/domains/modules/trip'
import { useConfirmDialog } from '../../../../shared/components/confirm-dialog/useConfirmDialog'
import { BottomSheet } from '../../../../shared/components/bottom-sheet/BottomSheet'
import { Button } from '../../../../shared/components/mui'
import { useOverlay } from '../../../../shared/hooks/useOverlay'
import { usePlaceDetailOverlay } from '../../../place/place-detail/usePlaceDetailOverlay'
import { PlaceForm, type PlaceFormRef, type PlaceFormValues } from './PlaceForm'
import { PlaceTitleButton } from './PlaceTitleButton'

interface OpenParams {
  tripId: string
  placeId: string
  defaultValues?: Partial<PlaceFormValues>
  onDelete?: () => void
}

// 웹 useTripPlaceFormOverlay 와 같은 시그니처를 유지한다.
// 저장은 훅 안에서 끝내고 호출부에는 Promise<void> 만 돌려준다.
// 앱은 화면 분기가 없으므로 시트 하나만 둔다.
export function useTripPlaceFormOverlay() {
  const overlay = useOverlay()
  const confirm = useConfirmDialog()
  const placeDetail = usePlaceDetailOverlay()

  const openBottomSheet = useCallback(
    ({ tripId, placeId, defaultValues, onDelete }: OpenParams) => {
      return new Promise<void>((resolve) => {
        overlay.open(({ isOpen, close }) => (
          <PlaceFormSheet
            tripId={tripId}
            placeId={placeId}
            defaultValues={defaultValues}
            isOpen={isOpen}
            confirm={confirm}
            onOpenDetail={placeDetail.open}
            onDelete={onDelete}
            onClose={() => {
              resolve()
              close()
            }}
          />
        ))
      })
    },
    [confirm, overlay, placeDetail],
  )

  return { openBottomSheet }
}

interface SheetProps extends OpenParams {
  isOpen: boolean
  confirm: (message: string) => Promise<boolean>
  onOpenDetail: (placeId: string) => void
  onClose: () => void
}

function PlaceFormSheet({
  tripId,
  placeId,
  defaultValues,
  isOpen,
  confirm,
  onOpenDetail,
  onDelete,
  onClose,
}: SheetProps) {
  const { update } = useTripPlaces(tripId)
  const formRef = { current: null as PlaceFormRef | null }

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
          name={defaultValues?.name ?? '장소 수정'}
          onClick={() => {
            const detailPlaceId = defaultValues?.placeId
            if (detailPlaceId != null) onOpenDetail(detailPlaceId)
          }}
        />
        <Button
          variant="outlined"
          color="error"
          size="small"
          onClick={async () => {
            if (await confirm('삭제하시겠습니까?')) {
              onDelete?.()
              onClose()
            }
          }}
        >
          삭제
        </Button>
      </BottomSheet.Header>
      <BottomSheet.Body sx={{ paddingHorizontal: 16 }}>
        <PlaceForm
          ref={(instance) => {
            formRef.current = instance
          }}
          tripId={tripId}
          defaultValues={defaultValues}
          onSubmit={(data) => {
            void update({
              id: placeId,
              category: data.category,
              memo: data.memo,
              tags: data.tags,
            })
            onClose()
          }}
        />
      </BottomSheet.Body>
      <BottomSheet.BottomActions>
        <Button variant="outlined" fullWidth onClick={onClose}>
          취소
        </Button>
        <Button variant="contained" fullWidth onClick={() => formRef.current?.submit()}>
          저장
        </Button>
      </BottomSheet.BottomActions>
    </BottomSheet>
  )
}
