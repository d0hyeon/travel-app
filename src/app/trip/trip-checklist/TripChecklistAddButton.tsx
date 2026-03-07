import { Button, Dialog, DialogActions, DialogContent, type ButtonProps } from "@mui/material";
import { BottomSheet } from "~shared/components/BottomSheet";
import { useIsMobile } from "~shared/hooks/useIsMobile";
import { useLoading } from "~shared/hooks/useLoading";
import { useOverlay } from "~shared/hooks/useOverlay";
import { TripChecklistForm } from "./TripChecklistForm";
import { useTripChecklist } from "./useTripChecklist";

interface Props extends Omit<ButtonProps, 'onClick'> {
  tripId: string;
}
export function TripChecklistAddButton({ tripId, ...props }: Props) {
  const [isLoading, startTransition] = useLoading();
  const { add } = useTripChecklist(tripId)
  const overlay = useOverlay();
  const isMobile = useIsMobile();

  return (
    <Button
      variant="contained"
      loading={isLoading}
      loadingPosition="start"
      onClick={() => {
        startTransition(async () => {
          const { promise, resolve } = Promise.withResolvers<void>();

          overlay.open(({ isOpen, close }) => {
            const formId = Date.now().toString()
            const handleClose = () => {
              resolve();
              close();
            }
            if (isMobile) {
              return (
                <BottomSheet isOpen={isOpen} onClose={handleClose}>
                  <BottomSheet.Body>
                    <TripChecklistForm
                      tripId={tripId}
                      id={formId}
                      onSubmit={async (data) => {
                        await add(data);
                        handleClose();
                      }}
                    />
                  </BottomSheet.Body>
                  <BottomSheet.BottomActions>
                    <Button onClick={handleClose} variant="outlined" fullWidth>취소</Button>
                    <Button
                      type="submit"
                      form={formId}
                      formTarget={formId}
                      variant="contained"
                      fullWidth
                    >
                      확인
                    </Button>
                  </BottomSheet.BottomActions>
                </BottomSheet>
              )
            }

            return (
              <Dialog
                open={isOpen}
                onClose={handleClose}
              >
                <DialogContent>
                  <TripChecklistForm
                    tripId={tripId}
                    id={formId}
                    onSubmit={async (data) => {
                      await add(data);
                      handleClose();
                    }}
                  />
                </DialogContent>
                <DialogActions>
                  <Button onClick={handleClose} variant="outlined">취소</Button>
                  <Button
                    type="submit"
                    form={formId}
                    formTarget={formId}
                    variant="contained"
                  >
                    확인
                  </Button>
                </DialogActions>
              </Dialog>
            )
          })

          await promise
        })
      }}
      {...props}
    >
      추가
    </Button>
  )
}