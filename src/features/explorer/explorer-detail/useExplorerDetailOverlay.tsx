import { useOverlay } from "~shared/hooks/useOverlay"
import type { ExploredPlace } from "../explorer.api"
import { PlaceExplorerDetailFullscreen } from "./PlaceExplorerDetailFullscreen"
import { useCallback } from "react"
import { PlaceExplorerDetailSidePanel } from "./PlaceExplorerDetailSidePanel"

export function useExplorerDetailOverlay() {
  const overlay = useOverlay()

  const openFullScreen = useCallback((place: ExploredPlace) => {
    overlay.open(({ isOpen, close }) => (
      <PlaceExplorerDetailFullscreen isOpen={isOpen} placeId={place.placeId} onClose={close} />
    ))
  }, [])

  const openSideSheet = useCallback((place: ExploredPlace) => {
    overlay.open(({ isOpen, close }) => {

      return (
        <PlaceExplorerDetailSidePanel
          isOpen={isOpen}
          place={place}
          onClose={close}
        />
      )
    })
  }, []);

  return { openFullScreen, openSideSheet }
}