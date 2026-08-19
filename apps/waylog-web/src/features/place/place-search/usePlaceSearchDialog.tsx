import { useCallback } from "react";
import { useOverlay } from "../../../shared/hooks/useOverlay";
import type { MapType } from "../../../shared/components/Map";
import { PlaceSearchDialog, type PlaceSearchResult } from "./PlaceSearchDialog";

interface UsePlaceSearchDialogOptions {
  service?: MapType
}

export function usePlaceSearchDialog(options: UsePlaceSearchDialogOptions = {}) {
  const { service = 'kakao' } = options;
  const overlay = useOverlay();

  const searchPlace = useCallback(() => {
    return new Promise<PlaceSearchResult | null>(resolve => {
      overlay.open(({ close, isOpen }) => (
        <PlaceSearchDialog
          isOpen={isOpen}
          service={service}
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
  }, [service])

  return { searchPlace }
}
