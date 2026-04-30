import { useCallback } from "react";
import { useOverlay } from "../../../shared/hooks/useOverlay";
import type { Coordinate, MapType } from "../../../shared/components/Map";
import { PlaceSearchBottomSheet } from "./PlaceSearchBottomSheet";
import { type PlaceSearchResult } from "./PlaceSearchDialog";

interface UsePlaceSearchBottomSheetOptions {
  service?: 'kakao' | 'google';
  center?: Coordinate
}

export function usePlaceSearchBottomSheet(options: UsePlaceSearchBottomSheetOptions = {}) {
  const { service = 'kakao' } = options;
  const overlay = useOverlay();

  const searchPlace = useCallback(() => {
    return new Promise<PlaceSearchResult | null>(resolve => {
      overlay.open(({ close, isOpen }) => (
        <PlaceSearchBottomSheet
          {...options}
          service={service}
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
  }, [service])

  return { searchPlace }
}
