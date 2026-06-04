import { lazy, Suspense } from 'react'
import { useIsMobile } from '~shared/hooks/env/useIsMobile'
import { PlaceExplorerPageMobile } from './PlaceExplorerPage.mobile'

const PlaceExplorerPageDesktop = lazy(() =>
  import('./PlaceExplorerPage.desktop').then((m) => ({ default: m.PlaceExplorerPageDesktop }))
)

export default function PlaceExplorerPage() {
  const isMobile = useIsMobile()

  if (isMobile) {
    return <PlaceExplorerPageMobile />
  }

  return (
    <Suspense fallback={<PlaceExplorerPageMobile />}>
      <PlaceExplorerPageDesktop />
    </Suspense>
  )
}
