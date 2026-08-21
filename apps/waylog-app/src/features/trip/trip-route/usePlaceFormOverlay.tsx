import { useCallback } from 'react'
import { BottomSheet } from '../../../shared/components/bottom-sheet/BottomSheet'
import { Button } from '../../../shared/components/mui'
import { useOverlay } from '../../../shared/hooks/useOverlay'
import { PlaceForm, type PlaceFormRef, type PlaceFormValues } from '../trip-place/trip-place-form/PlaceForm'

interface OpenParams {
  tripId: string
  placeId: string
  defaultValues?: Partial<PlaceFormValues>
}

// 웹 usePlaceFormOverlay 와 같은 시그니처를 유지한다.
// 앱은 화면 분기가 없으므로 시트 하나만 둔다.
export function usePlaceFormOverlay() {
  const overlay = useOverlay()

  const openBottomsheet = useCallback(
    ({ defaultValues }: OpenParams) => {
      return new Promise<PlaceFormValues | null>((resolve) => {
        overlay.open(({ isOpen, close }) => {
          const formRef = { current: null as PlaceFormRef | null }

          return (
            <BottomSheet
              isOpen={isOpen}
              onClose={() => {
                resolve(null)
                close()
              }}
              snapPoints={[0.7]}
              defaultSnapIndex={0}
            >
              <BottomSheet.Header>장소 수정</BottomSheet.Header>
              <BottomSheet.Body sx={{ paddingHorizontal: 16 }}>
                <PlaceForm
                  ref={(instance) => {
                    formRef.current = instance
                  }}
                  defaultValues={defaultValues}
                  onSubmit={(data) => {
                    resolve(data)
                    close()
                  }}
                />
              </BottomSheet.Body>
              <BottomSheet.BottomActions>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => {
                    resolve(null)
                    close()
                  }}
                >
                  취소
                </Button>
                <Button variant="contained" fullWidth onClick={() => formRef.current?.submit()}>
                  저장
                </Button>
              </BottomSheet.BottomActions>
            </BottomSheet>
          )
        })
      })
    },
    [overlay],
  )

  return { openBottomsheet }
}
