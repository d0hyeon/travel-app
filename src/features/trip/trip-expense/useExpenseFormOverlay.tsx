import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Stack,
} from "@mui/material"
import { useCallback, type ComponentProps, type ReactNode } from "react"
import { DialogTitle } from '~shared/modules/confirm-dialog/DialogTitle'
import { useOverlay } from "../../../shared/hooks/useOverlay"
import { ExpenseForm, type ExpenseFormValues } from "./ExpenseForm"
import { BottomSheet } from "~shared/components/BottomSheet"

export type RenderProps = {
  close: () => void;
}

interface OpenFormParams {
  title?: string
  defaultValues?: Partial<ExpenseFormValues>;
  renderAction?: (props: RenderProps) => ReactNode;
}

export function useExpenseFormOverlay(tripId: string) {
  const overlay = useOverlay()

  const open = useCallback((params: OpenFormParams = {}) => {
    const { title = '지출 추가', defaultValues } = params;

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
                    >
                      취소
                    </Button>
                    <ExpenseForm.SubmitButton size="large" />
                  </DialogActions>
                )}
              />
            </Box>
          </DialogContent>
        </Dialog>
      ))
    })
  }, [overlay])

  return { open }
}


type BottomSheetParams = {
  renderActions?: (props: RenderProps) => ReactNode;
} & OpenFormParams & Omit<ComponentProps<typeof BottomSheet>, 'isOpen' | 'onClose' | 'children'>

export function useExpenseFormBottomSheet(tripId: string) {
  const overlay = useOverlay();

  const open = useCallback(({ defaultValues, renderActions, ...params }: BottomSheetParams = {}) => {
    return new Promise<ExpenseFormValues | null>((resolve) => {
      overlay.open(({ close, isOpen }) => {
        const defaultAction = <ExpenseFormOverlayActions onCancel={close} />

        return (
          <BottomSheet
            isOpen={isOpen}
            onClose={close}
            snapPoints={[0.8]}
            {...params}
          >
            <ExpenseForm
              tripId={tripId}
              padding={2}
              defaultValues={defaultValues}
              onSubmit={(data) => {
                resolve(data);
                close()
              }}
              action={renderActions?.({ close }) ?? defaultAction}
            />
          </BottomSheet>
        )
      })
    })
  }, []);

  return { open }
}

type ActionsProps = {
  onCancel?: () => void;
  secondary?: ReactNode;
}
export function ExpenseFormOverlayActions({ onCancel, secondary }: ActionsProps) {
  return (
    <Stack
      position="absolute"
      marginLeft="-16px !important"
      padding={2}
      bottom={0}
      width="100%"
      direction="row"
      gap={1}
      sx={{ backgroundColor: '#fff', zIndex: 10 }}
    >
      {secondary}
      <Button
        type="button"
        onClick={onCancel}
        size="large"
        variant="outlined"
        fullWidth
      >
        취소
      </Button>
      <ExpenseForm.SubmitButton size="large" />
    </Stack>
  )
}