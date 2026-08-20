import { useCallback } from 'react'
import { BottomSheet } from '../../../shared/components/bottom-sheet/BottomSheet'
import { Button } from '../../../shared/components/mui'
import { useOverlay } from '../../../shared/hooks/useOverlay'
import { ExpenseForm, type ExpenseFormRef, type ExpenseFormValues } from './ExpenseForm'

interface OpenParams {
  defaultValues?: Partial<ExpenseFormValues>
}

// 웹 useExpenseFormBottomSheet 와 같은 시그니처를 유지한다.
export function useExpenseFormBottomSheet(tripId: string) {
  const overlay = useOverlay()

  const open = useCallback(
    ({ defaultValues }: OpenParams = {}) => {
      return new Promise<ExpenseFormValues | null>((resolve) => {
        overlay.open(({ isOpen, close }) => {
          const formRef = { current: null as ExpenseFormRef | null }

          const cancel = () => {
            resolve(null)
            close()
          }

          return (
            <BottomSheet isOpen={isOpen} onClose={cancel} snapPoints={[0.8]} defaultSnapIndex={0}>
              <BottomSheet.Header>
                {defaultValues != null ? '지출 수정' : '지출 추가'}
              </BottomSheet.Header>
              <BottomSheet.Body sx={{ paddingHorizontal: 16 }}>
                <ExpenseForm
                  ref={(instance) => {
                    formRef.current = instance
                  }}
                  tripId={tripId}
                  defaultValues={defaultValues}
                  onSubmit={(data) => {
                    resolve(data)
                    close()
                  }}
                />
              </BottomSheet.Body>
              <BottomSheet.BottomActions>
                <Button variant="outlined" fullWidth onClick={cancel}>
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
    [overlay, tripId],
  )

  return { open }
}
