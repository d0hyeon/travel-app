import { useCallback } from "react";
import { useOverlay } from "../../../shared/hooks/useOverlay";
import type { Coordinate } from "../../../shared/components/Map";
import { PlaceSearchBottomSheet } from "./PlaceSearchBottomSheet";
import type { PlaceResult } from '@waylog/domains/modules/place'

interface UsePlaceSearchBottomSheetOptions {
  service?: 'kakao' | 'google';
  center?: Coordinate
}

export function usePlaceSearchBottomSheet(options: UsePlaceSearchBottomSheetOptions = {}) {
  const { service = 'kakao' } = options;
  const overlay = useOverlay();

  const searchPlace = useCallback(() => {
    return new Promise<PlaceResult | null>(resolve => {
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
