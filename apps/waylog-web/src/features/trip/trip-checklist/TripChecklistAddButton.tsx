import { Button, Dialog, DialogActions, DialogContent, Fab, type ButtonProps, type FabProps } from "@mui/material";
import { BottomSheet } from "~shared/components/bottom-sheet/BottomSheet";
import { useIsMobile } from "~shared/hooks/env/useIsMobile";
import { useLoading } from "@waylog/react";
import { useOverlay } from "~shared/hooks/useOverlay";
import { TripChecklistForm, type TripChecklistFormValue } from "./TripChecklistForm";
import { useTripChecklist } from '@waylog/domains/modules/trip-checklist';
import { DialogTitle } from "~shared/components/confirm-dialog/DialogTitle";
import AddIcon from '@mui/icons-material/Add';
import { useCallback } from "react";
import { toast } from "sonner";

interface TripAddFabProps extends Omit<FabProps, 'onClick'> {
  tripId: string;
}
export function TripChecklistAddFab({ tripId, ...props }: TripAddFabProps) {
  const { add } = useTripChecklist(tripId)
  const { open: getWritedTodo } = useChecklistFormOverlay(tripId)

  return (
    <Fab
      color="primary"
      size="medium"
      aria-label="추가"
      onClick={async () => {
        const data = await getWritedTodo();
        if (data != null) {
          await add(data);
          toast.success('체크리스트를 생성했어요');
        }
      }}
      {...props}
    >
      <AddIcon />
    </Fab>
  )
}

interface TripAddButtonProps extends Omit<ButtonProps, 'onClick'> {
  tripId: string;
}

export function TripChecklistAddButton({ tripId, ...props }: TripAddButtonProps) {
  const { add } = useTripChecklist(tripId)
  const todoFormOverlay = useChecklistFormOverlay(tripId);
  const [isLoading, startTransition] = useLoading();

  return (
    <Button
      variant="contained"
      color="primary"
      size="medium"
      loading={isLoading}
      aria-label="추가"
      onClick={() => {
        startTransition(async () => {
          await todoFormOverlay.open({
            onSubmit: async (data) => {
              await add(data);
              toast.success('체크리스트를 생성했어요');
            }
          })
        })
      }}
      {...props}
    >
      추가
    </Button>
  )
}

interface OpenParams {
  onSubmit?: (data: TripChecklistFormValue) => void;
}

function useChecklistFormOverlay(tripId: string) {
  const overlay = useOverlay();
  const isMobile = useIsMobile();


  const open = useCallback((params?: OpenParams) => {
    return new Promise<TripChecklistFormValue | null>((resolve) => {
      overlay.open(({ isOpen, close }) => {
        const formId = Date.now().toString();

        const handleSubmit = async (data: TripChecklistFormValue) => {
          close();
          await params?.onSubmit?.(data)
          resolve(data)
        }

        const handleClose = () => {
          resolve(null);
          close();
        }

        if (isMobile) {
          return (
            <BottomSheet isOpen={isOpen} onClose={handleClose}>
              <BottomSheet.Header>체크리스트</BottomSheet.Header>
              <BottomSheet.Body>
                <TripChecklistForm tripId={tripId} id={formId} onSubmit={handleSubmit} />
              </BottomSheet.Body>
              <BottomSheet.BottomActions>
                <Button onClick={handleClose} variant="outlined" fullWidth>취소</Button>
                <Button type="submit" form={formId} formTarget={formId} variant="contained" fullWidth>
                  확인
                </Button>
              </BottomSheet.BottomActions>
            </BottomSheet>
          )
        }

        return (
          <Dialog open={isOpen} onClose={handleClose} >
            <DialogTitle>체크리스트</DialogTitle>
            <DialogContent>
              <TripChecklistForm tripId={tripId} id={formId} onSubmit={handleSubmit} />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClose} variant="outlined">취소</Button>
              <Button type="submit" form={formId} formTarget={formId} variant="contained">
                확인
              </Button>
            </DialogActions>
          </Dialog>
        )
      })
    })

  }, [overlay, isMobile]);

  return { open }
}