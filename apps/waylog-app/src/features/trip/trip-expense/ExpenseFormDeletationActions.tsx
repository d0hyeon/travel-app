import { useExpenses } from '@waylog/domains/modules/expense'
import { Button } from '../../../shared/components/mui'
import { useConfirmDialog } from '../../../shared/components/confirm-dialog/useConfirmDialog'
import { ExpenseFormOverlayActions } from './useExpenseFormOverlay'

interface Props {
  tripId: string
  expenseId: string
  onClose: () => void
  onSubmit: () => void
}

// 웹 ExpenseFormDeletationActions 와 같은 역할 — 지출 수정 폼에 삭제 액션을 얹는다.
export function ExpenseFormDeletationActions({ tripId, expenseId, onClose, onSubmit }: Props) {
  const confirm = useConfirmDialog()
  const { remove } = useExpenses(tripId)

  const handleDelete = async () => {
    if (!(await confirm('삭제하시겠어요?'))) return

    onClose()
    remove(expenseId)
  }

  return (
    <ExpenseFormOverlayActions
      onCancel={onClose}
      onSubmit={onSubmit}
      secondary={
        <Button variant="outlined" color="error" onClick={handleDelete}>
          삭제
        </Button>
      }
    />
  )
}
