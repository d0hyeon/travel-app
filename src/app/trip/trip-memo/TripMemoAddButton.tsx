import { Button, Dialog, DialogActions, DialogContent, type ButtonProps } from "@mui/material";
import { BottomSheet } from "~shared/components/BottomSheet";
import { useIsMobile } from "~shared/hooks/useIsMobile";
import { useLoading } from "~shared/hooks/useLoading";
import { useOverlay } from "~shared/hooks/useOverlay";
import { TripMemoForm } from "./TripMemoForm";
import { useTripMemo } from "./useTripMemo";

interface Props extends Omit<ButtonProps, 'onClick'> {
  tripId: string;
}

export function TripMemoAddButton({ tripId, ...props }: Props) {
  const [isLoading, startTransition] = useLoading();
  const { add } = useTripMemo(tripId);
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
            const formId = Date.now().toString();
            const handleClose = () => {
              resolve();
              close();
            };

            if (isMobile) {
              return (
                <BottomSheet isOpen={isOpen} onClose={handleClose}>
                  <BottomSheet.Header>메모</BottomSheet.Header>
                  <BottomSheet.Body>
                    <TripMemoForm
                      id={formId}
                      onSubmit={async (content) => {
                        await add({ content });
                        handleClose();
                      }}
                    />
                  </BottomSheet.Body>
                  <BottomSheet.BottomActions>
                    <Button onClick={handleClose} variant="outlined" fullWidth>
                      취소
                    </Button>
                    <Button
                      type="submit"
                      form={formId}
                      formTarget={formId}
                      variant="contained"
                      fullWidth
                    >
                      저장
                    </Button>
                  </BottomSheet.BottomActions>
                </BottomSheet>
              );
            }

            return (
              <Dialog open={isOpen} onClose={handleClose}>
                <DialogContent>
                  <TripMemoForm
                    id={formId}
                    onSubmit={async (content) => {
                      await add({ content });
                      handleClose();
                    }}
                  />
                </DialogContent>
                <DialogActions>
                  <Button onClick={handleClose} variant="outlined">
                    취소
                  </Button>
                  <Button
                    type="submit"
                    form={formId}
                    formTarget={formId}
                    variant="contained"
                  >
                    저장
                  </Button>
                </DialogActions>
              </Dialog>
            );
          });

          await promise;
        });
      }}
      {...props}
    >
      추가
    </Button>
  );
}
