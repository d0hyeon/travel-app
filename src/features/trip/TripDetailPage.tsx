import { useIsMobile } from '../../shared/hooks/useIsMobile'
import { lazy } from 'react';

const TripDetailPageDesktop = lazy(async () => {
  const { TripDetailPageDesktop } = await import('./TripDetailPage.desktop');
  return { default: TripDetailPageDesktop };
})

const TripDetailPageMobile = lazy(async () => {
  const { TripDetailPageMobile } = await import('./TripDetailPage.mobile');
  return { default: TripDetailPageMobile };
})

export default function TripDetailPage() {
  const isMobile = useIsMobile()

  if (isMobile) {
    return <TripDetailPageMobile />
  }

  return <TripDetailPageDesktop />
}
