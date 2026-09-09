import { useCallback, useRef, type ComponentProps, type ReactNode } from 'react'
import { BottomSheet } from '../../../shared/components/bottom-sheet/BottomSheet'
import { Button } from '~/shared/components/design-system'
import { useOverlay } from '../../../shared/hooks/useOverlay'
import { ExpenseForm, type ExpenseFormRef, type ExpenseFormValues } from './ExpenseForm'

export interface RenderProps {
  close: () => void
  submit: () => void
}

type OpenParams = {
  defaultValues?: Partial<ExpenseFormValues>
  mode?: 'create' | 'edit'
  renderActions?: (props: RenderProps) => ReactNode
} & Omit<ComponentProps<typeof BottomSheet>, 'isOpen' | 'onDismiss' | 'onClose' | 'children'>

// 웹 useExpenseFormBottomSheet 와 같은 시그니처를 유지한다.
// 웹은 renderActions 가 반환한 노드를 폼의 action 슬롯에 넣지만,
// 앱은 시트 하단 액션 영역(BottomSheet.BottomActions)에 배치한다.
export function useExpenseFormBottomSheet(tripId: string) {
  const overlay = useOverlay()

  const open = useCallback(
    ({ defaultValues, mode = 'create', renderActions, ...sheetProps }: OpenParams = {}) => {
      return new Promise<ExpenseFormValues | null>((resolve) => {
        overlay.open(({ isOpen, close }) => (
          <ExpenseFormSheet
            tripId={tripId}
            defaultValues={defaultValues}
            mode={mode}
            renderActions={renderActions}
            sheetProps={sheetProps}
            isOpen={isOpen}
            onSubmit={(data) => {
              resolve(data)
              close()
            }}
            onCancel={() => {
              resolve(null)
              close()
            }}
          />
        ))
      })
    },
    [overlay, tripId],
  )

  return { open }
}

interface SheetProps {
  tripId: string
  defaultValues?: Partial<ExpenseFormValues>
  mode: 'create' | 'edit'
  renderActions?: (props: RenderProps) => ReactNode
  sheetProps: Omit<ComponentProps<typeof BottomSheet>, 'isOpen' | 'onDismiss' | 'onClose' | 'children'>
  isOpen: boolean
  onSubmit: (data: ExpenseFormValues) => void
  onCancel: () => void
}

function ExpenseFormSheet({ tripId, defaultValues, mode, renderActions, sheetProps, isOpen, onSubmit, onCancel }: SheetProps) {
  const formRef = useRef<ExpenseFormRef>(null)
  const submit = () => formRef.current?.submit()

  return (
    <BottomSheet
      isOpen={isOpen}
      onDismiss={onCancel}
      safeArea
      snapPoints={[0.8]}
      defaultSnapIndex={0}
      {...sheetProps}
    >
      <BottomSheet.Header>
        {mode === 'edit' ? '결제 금액 수정' : '결제 금액'}
      </BottomSheet.Header>
      <BottomSheet.KeyboardAwareBody style={{ paddingHorizontal: 16 }}>
        <ExpenseForm ref={formRef} tripId={tripId} defaultValues={defaultValues} onSubmit={onSubmit} />
      </BottomSheet.KeyboardAwareBody>
      <BottomSheet.BottomActions>
        {renderActions?.({ close: onCancel, submit }) ?? (
          <ExpenseFormOverlayActions onCancel={onCancel} onSubmit={submit} />
        )}
      </BottomSheet.BottomActions>
    </BottomSheet>
  )
}

interface ActionsProps {
  onCancel: () => void
  onSubmit: () => void
  secondary?: ReactNode
}

// 웹 ExpenseFormOverlayActions 와 같은 역할 — 취소·저장 기본 액션에
// secondary 슬롯으로 삭제 같은 부가 액션을 앞에 끼운다.
export function ExpenseFormOverlayActions({ onCancel, onSubmit, secondary }: ActionsProps) {
  return (
    <>
      {secondary}
      <Button variant="outlined" fullWidth onPress={onCancel}>
        취소
      </Button>
      <Button variant="contained" fullWidth onPress={onSubmit}>
        저장
      </Button>
    </>
  )
}
