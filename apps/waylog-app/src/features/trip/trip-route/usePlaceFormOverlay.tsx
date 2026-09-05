import { useCallback, useRef } from 'react'
import { MaterialIcons } from '@expo/vector-icons'
import { useConfirmDialog } from '../../../shared/components/confirm-dialog/useConfirmDialog'
import { BottomSheet } from '../../../shared/components/bottom-sheet/BottomSheet'
import { Button, Stack, Typography } from '../../../shared/components/mui'
import { useOverlay } from '../../../shared/hooks/useOverlay'
import { PlaceForm, type PlaceFormRef, type PlaceFormValues } from '../trip-place/trip-place-form/PlaceForm'

interface OpenParams {
  tripId: string
  placeId: string
  defaultValues?: Partial<PlaceFormValues>
  onDelete?: () => void
}

// 웹 usePlaceFormOverlay 와 같은 시그니처를 유지한다.
// 앱은 화면 분기가 없으므로 시트 하나만 둔다.
export function usePlaceFormOverlay() {
  const overlay = useOverlay()

  const openBottomsheet = useCallback(
    ({ tripId, defaultValues, onDelete }: OpenParams) => {
      return new Promise<PlaceFormValues | null>((resolve) => {
        overlay.open(({ isOpen, close }) => (
          <PlaceFormSheet
            tripId={tripId}
            defaultValues={defaultValues}
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
  defaultValues?: Partial<PlaceFormValues>
  isOpen: boolean
  onDelete?: () => void
  onSubmit: (data: PlaceFormValues) => void
  onDismiss: () => void
}

function PlaceFormSheet({ tripId, defaultValues, isOpen, onDelete, onSubmit, onDismiss }: SheetProps) {
  const confirm = useConfirmDialog()
  const formRef = useRef<PlaceFormRef>(null)

  return (
    <BottomSheet isOpen={isOpen} safeArea onDismiss={onDismiss} snapPoints={[0.7]} defaultSnapIndex={0}>
      <BottomSheet.Header direction="row" justifyContent="space-between">
        <Stack direction="row" gap={0.5} alignItems="center">
          <Typography variant="h6" sx={{ fontWeight: '800' }}>{defaultValues?.name ?? '장소 수정'}</Typography>
          <MaterialIcons name="chevron-right" size={28} color="#666" />
        </Stack>
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
        <PlaceForm ref={formRef} tripId={tripId} defaultValues={defaultValues} onSubmit={onSubmit} />
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
