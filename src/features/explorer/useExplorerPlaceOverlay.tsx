import type { ReactNode } from "react"
import { generatePath } from "react-router"
import { AppRoute } from "~app/routes"
import { PlaceFullScreenModal } from "~features/place/place-detail/PlaceFullScreenModal"
import { PlaceSidePanel } from "~features/place/place-detail/PlaceSidePanel"
import { useRouteOverlay } from "~shared/hooks/extends/useRouteOverlay"

interface TriggerProps {
  placeId: string;
  children?: ReactNode;
}

export function useExplorerPlaceModal() {
  const { Link, ...overlay } = useRouteOverlay(
    (placeId: string) => generatePath(AppRoute.장소_상세, { placeId }),
    ({ isOpen, close, data: placeId }) => <PlaceFullScreenModal isOpen={isOpen} placeId={placeId} onClose={close} />
  )

  return {
    Trigger: ({ placeId, children }: TriggerProps) => <Link data={placeId}>{children}</Link>,
    ...overlay
  }
}

export function useExplorerPlaceSidePannel() {
  const { Link, ...overlay } = useRouteOverlay(
    (placeId: string) => generatePath(AppRoute.장소_상세, { placeId }),
    ({ isOpen, close, data: placeId }) => <PlaceSidePanel isOpen={isOpen} placeId={placeId} onClose={close} />
  )

  return {
    Trigger: ({ placeId, children }: TriggerProps) => <Link data={placeId}>{children}</Link>,
    ...overlay
  }
}