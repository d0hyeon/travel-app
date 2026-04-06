import { Button, Dialog, DialogActions, DialogContent, IconButton, Typography, type IconButtonProps } from "@mui/material";
import { useTripChecklist } from "./useTripChecklist";
import { useOverlay } from "~shared/hooks/useOverlay";
import { useId } from "react";
import { DialogTitle } from "~shared/components/confirm-dialog/DialogTitle";
import { TripChecklistForm } from "./TripChecklistForm";
import { BottomSheet } from "~shared/components/BottomSheet";
import { useIsMobile } from "~shared/hooks/useIsMobile";

interface Props {
  id: string;
  tripId: string;
}
export interface ModifyButtonProps extends Omit<IconButtonProps, 'id'>, Props {
}

export function useTripChecklistModifyOverlay(tripId: string) {
  const { data: { checklist }, update } = useTripChecklist(tripId);
  const overlay = useOverlay();

  const formId = useId();

  const openDialog = (id: string) => {
    const item = checklist.find(x => id === x.id);

    overlay.open(({ isOpen, close }) => (
      <Dialog
        open={isOpen}
        onClose={close}
      >
        <DialogTitle>체크리스트</DialogTitle>
        <DialogContent>
          <TripChecklistForm
            tripId={tripId}
            id={formId}
            defaultValues={item}
            onSubmit={async (data) => {
              await update({ id, ...data });
              close();
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={close} variant="outlined">취소</Button>
          <Button type="submit" form={formId} onClick={close} variant="contained">확인</Button>
        </DialogActions>
      </Dialog>
    ))
  }

  const openBottomSheet = (id: string) => {
    const item = checklist.find(x => id === x.id);

    overlay.open(({ isOpen, close }) => (
      <BottomSheet isOpen={isOpen} onClose={close}>
        <BottomSheet.Header>
          <Typography variant="h6">체크리스트</Typography>
        </BottomSheet.Header>
        <BottomSheet.Body>
          <TripChecklistForm
            tripId={tripId}
            id={formId}
            defaultValues={item}
            onSubmit={async (data) => {
              await update({ id, ...data });
              close();
            }}
          />
        </BottomSheet.Body>
        <BottomSheet.BottomActions>
          <Button onClick={close} variant="outlined" fullWidth>취소</Button>
          <Button type="submit" form={formId} onClick={close} variant="contained" fullWidth>확인</Button>
        </BottomSheet.BottomActions>
      </BottomSheet>
    ))
  }

  return { openBottomSheet, openDialog }
}

export function TripChecklistModifyIconButton({ id, tripId, ...props }: ModifyButtonProps) {
  const { data: { checklist }, update } = useTripChecklist(tripId);
  const item = checklist.find(x => id === x.id);
  const overlay = useOverlay();

  const formId = useId();

  const openFormDialog = () => {
    overlay.open(({ isOpen, close }) => (
      <Dialog
        open={isOpen}
        onClose={close}
      >
        <DialogTitle>체크리스트</DialogTitle>
        <DialogContent>
          <TripChecklistForm
            tripId={tripId}
            id={formId}
            defaultValues={item}
            onSubmit={async (data) => {
              await update({ id, ...data });
              close();
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={close} variant="outlined">취소</Button>
          <Button type="submit" form={formId} onClick={close} variant="contained">확인</Button>
        </DialogActions>
      </Dialog>
    ))
  }

  const openFormSheet = () => {
    overlay.open(({ isOpen, close }) => (
      <BottomSheet isOpen={isOpen} onClose={close}>
        <BottomSheet.Header>
          <Typography variant="h6">체크리스트</Typography>
        </BottomSheet.Header>
        <BottomSheet.Body>
          <TripChecklistForm
            tripId={tripId}
            id={formId}
            defaultValues={item}
            onSubmit={async (data) => {
              await update({ id, ...data });
              close();
            }}
          />
        </BottomSheet.Body>
        <BottomSheet.BottomActions>
          <Button onClick={close} variant="outlined" fullWidth>취소</Button>
          <Button type="submit" form={formId} onClick={close} variant="contained" fullWidth>확인</Button>
        </BottomSheet.BottomActions>
      </BottomSheet>
    ))
  }

  const isMobile = useIsMobile();

  return (
    <IconButton
      onClick={() => isMobile ? openFormSheet() : openFormDialog()}
      {...props} />

  )
}