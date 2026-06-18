import { useCallback, useEffect } from "react"
import { PlaceFullScreenModal } from "~features/place/place-detail/PlaceFullScreenModal"
import { PlaceSidePanel } from "~features/place/place-detail/PlaceSidePanel"
import { useOverlay } from "~shared/hooks/useOverlay"

type PlaceRef = { placeId: string; name: string }

export function useExplorerPlaceOverlay() {
  const overlay = useOverlay();

  const openFullScreen = useCallback((place: PlaceRef) => {
    overlay.open(({ isOpen, close }) => (
      <PlaceFullScreenModal isOpen={isOpen} placeId={place.placeId} onClose={close} />
    ))
  }, [])

  const openSideSheet = useCallback((place: PlaceRef) => {
    overlay.open(({ isOpen, close }) => (
      <PlaceSidePanel isOpen={isOpen} placeId={place.placeId} onClose={close} />
    ))
  }, [])

  useEffect(() => {
    return () => overlay.close();
  }, [])

  return { openFullScreen, openSideSheet }
}