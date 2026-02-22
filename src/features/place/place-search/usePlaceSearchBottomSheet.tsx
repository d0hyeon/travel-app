import { useCallback } from "react";
import { useOverlay } from "../../../shared/hooks/useOverlay";
import { PlaceSearchBottomSheet } from "./PlaceSearchBottomSheet";
import { type PlaceSearchResult } from "./PlaceSearchDialog";

export function usePlaceSearchBottomSheet() {
  const overlay = useOverlay();

  const searchPlace = useCallback(() => {
    return new Promise<PlaceSearchResult | null>(resolve => {
      overlay.open(({ close, isOpen }) => (
        <PlaceSearchBottomSheet
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