import { useCallback } from "react";
import { useOverlay } from "~shared/hooks/useOverlay";
import { PlaceSelectSheet, PlaceSelectSheetProps } from "./PlaceSelectSheet";

type OpenProps = Omit<PlaceSelectSheetProps, 'tripId'>;

export function usePlaceSelectSheet(tripId: string) {
  const overlay = useOverlay();

  const open = useCallback((props: Partial<OpenProps>) => {
    return new Promise<string[] | null>((resolve) => {
      overlay.open(({ isOpen, close, onClose }) => (
        <PlaceSelectSheet
          {...props}
          isOpen={isOpen}
          onClose={onClose}
          onDismiss={() => {
            close();
            resolve(null);
          }}
          tripId={tripId}
          onConfirm={(placeIds) => {
            close();
            resolve(placeIds);
            props.onConfirm?.(placeIds);
          }}
        />
      ))
    })
  }, [])

  return { open }
}