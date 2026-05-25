import { useCallback } from "react"
import { useOverlay } from "~shared/hooks/useOverlay"
import { PlaceExplorerDetailFullscreen } from "./PlaceExplorerDetailFullscreen"
import { PlaceExplorerDetailSidePanel } from "./PlaceExplorerDetailSidePanel"

type PlaceRef = { placeId: string; name: string }

export function useExplorerDetailOverlay() {
  const overlay = useOverlay()

  const openFullScreen = useCallback((place: PlaceRef) => {
    overlay.open(({ isOpen, close }) => (
      <PlaceExplorerDetailFullscreen isOpen={isOpen} placeId={place.placeId} onClose={close} />
    ))
  }, [])

  const openSideSheet = useCallback((place: PlaceRef) => {
    overlay.open(({ isOpen, close }) => (
      <PlaceExplorerDetailSidePanel isOpen={isOpen} place={place} onClose={close} />
    ))
  }, [])

  return { openFullScreen, openSideSheet }
}