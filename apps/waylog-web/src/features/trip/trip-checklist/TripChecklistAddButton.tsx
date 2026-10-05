import { Button, Dialog, DialogActions, DialogContent, Fab, type ButtonProps, type FabProps } from "@mui/material";
import { BottomSheet } from "~shared/components/bottom-sheet/BottomSheet";
import { useIsMobile } from "~shared/hooks/env/useIsMobile";
import { useLoading } from "@waylog/react";
import { useOverlay } from "~shared/hooks/useOverlay";
import { TripChecklistForm, type TripChecklistFormValue } from "./TripChecklistForm";
import { useTripChecklist } from '@waylog/domains/modules/trip-checklist';
import { DialogTitle } from "~shared/components/confirm-dialog/DialogTitle";
import AddIcon from '@mui/icons-material/Add';

interface Props extends Omit<FabProps, 'onClick'> {
  tripId: string;
}
export function TripChecklistAddButton({ tripId, ...props }: Props) {
  const { add } = useTripChecklist(tripId)
  const overlay = useOverlay();
  const isMobile = useIsMobile();


  const handleClick = () => {
    overlay.open(({ isOpen, close }) => {
      const formId = Date.now().toString();

      const handleSubmit = async (data: TripChecklistFormValue) => {
        await add(data);
        close();
      }

      if (isMobile) {
        return (
          <BottomSheet isOpen={isOpen} onClose={close}>
            <BottomSheet.Header>체크리스트</BottomSheet.Header>
            <BottomSheet.Body>
              <TripChecklistForm tripId={tripId} id={formId} onSubmit={handleSubmit} />
            </BottomSheet.Body>
            <BottomSheet.BottomActions>
              <Button onClick={close} variant="outlined" fullWidth>취소</Button>
              <Button type="submit" form={formId} formTarget={formId} variant="contained" fullWidth>
                확인
              </Button>
            </BottomSheet.BottomActions>
          </BottomSheet>
        )
      }

      return (
        <Dialog open={isOpen} onClose={close} >
          <DialogTitle>체크리스트</DialogTitle>
          <DialogContent>
            <TripChecklistForm tripId={tripId} id={formId} onSubmit={handleSubmit} />
          </DialogContent>
          <DialogActions>
            <Button onClick={close} variant="outlined">취소</Button>
            <Button type="submit" form={formId} formTarget={formId} variant="contained">
              확인
            </Button>
          </DialogActions>
        </Dialog>
      )
    })
  }

  return (
    <Fab
      color="primary"
      size="medium"
      onClick={handleClick}
      {...props}
    >
      <AddIcon />
    </Fab>
  )

}