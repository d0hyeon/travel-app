import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
} from "@mui/material"
import { useCallback } from "react"
import { DialogTitle } from '~shared/modules/confirm-dialog/DialogTitle'
import { useOverlay } from "../../../shared/hooks/useOverlay"
import { useExpenses } from "../../expense/useExpenses"
import { ExpenseForm, type ExpenseFormValues } from "./ExpenseForm"

interface OpenFormParams {
  title?: string
  defaultValues?: Partial<ExpenseFormValues>
}

export function useExpenseFormOverlay(tripId: string) {
  const overlay = useOverlay()
  const { create } = useExpenses(tripId)

  const open = useCallback((params: OpenFormParams = {}) => {
    const { title = '지출 추가', defaultValues } = params
    return new Promise<ExpenseFormValues | null>((resolve) => {
      overlay.open(({ isOpen, close }) => (
        <Dialog open={isOpen} onClose={close} maxWidth="sm" fullWidth>
          <DialogTitle>{title}</DialogTitle>
          <DialogContent>
            <Box position="relative">
              <ExpenseForm
                tripId={tripId}
                defaultValues={defaultValues}
                onSubmit={(data) => {
                  resolve(data);
                  close()
                }}
                action={(
                  <DialogActions sx={{ position: 'sticky', bottom: 0, backgroundColor: '#fff' }}>
                    <Button
                      type="button"
                      onClick={() => {
                        resolve(null);
                        close();
                      }}
                      size="large"
                      variant="outlined"
                      fullWidth
                    >취소</Button>
                    <ExpenseForm.SubmitButton size="large" />
                  </DialogActions>
                )}
              />
            </Box>
          </DialogContent>
        </Dialog>
      ))
    })
  }, [overlay, tripId, create])

  return { open }
}
