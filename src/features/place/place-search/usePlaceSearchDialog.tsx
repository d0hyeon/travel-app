import { useCallback } from "react";
import { useOverlay } from "../../../shared/hooks/useOverlay";
import { PlaceSearchDialog, type PlaceSearchResult } from "./PlaceSearchDialog";

export function usePlaceSearchDialog() {
  const overlay = useOverlay();

  const searchPlace = useCallback(() => {
    return new Promise<PlaceSearchResult | null>(resolve => {
      overlay.open(({ close, isOpen }) => (
        <PlaceSearchDialog
          isOpen={isOpen}
          onClose={() => {
            close();
            resolve(null)
          }}
          onSelect={(data) => {
            close();
            resolve(data);
          }}
        />
      ))
    })
  }, [])

  return { searchPlace }
}