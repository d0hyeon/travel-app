import { Button } from "@mui/material";
import { ExpenseFormOverlayActions } from "./useExpenseFormOverlay";
import { useConfirmDialog } from "~shared/components/confirm-dialog/useConfirmDialog";
import { useExpenses } from "~app/expense/useExpenses";

type Props = {
  tripId: string;
  expenseId: string;
  onClose: () => void;
}

export function ExpenseFormDeletationActions({ tripId, expenseId, onClose }: Props) {
  const confirm = useConfirmDialog();
  const { remove } = useExpenses(tripId);

  const handleDelete = async () => {
    if (!(await confirm('삭제하시겠어요?'))) return
    onClose();
    setTimeout(() => remove(expenseId), 500)
  }
  return (
    <ExpenseFormOverlayActions
      onCancel={onClose}
      secondary={
        <Button
          type="button"
          size="large"
          variant="outlined"
          color="error"
          sx={{ flex: '0 0 auto' }}
          onClick={handleDelete}
        >
          삭제
        </Button>
      }
    />
  )
}