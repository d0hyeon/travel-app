import { useIsMobile } from '../../shared/hooks/useIsMobile'
import { TripDetailPageDesktop } from './TripDetailPage.desktop'
import { TripDetailPageMobile } from './TripDetailPage.mobile'

export function TripDetailPage() {
  const isMobile = useIsMobile()

  if (isMobile) {
    return <TripDetailPageMobile />
  }

  return <TripDetailPageDesktop />
}
