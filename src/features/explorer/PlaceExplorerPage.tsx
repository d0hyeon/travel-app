import { lazy, Suspense } from 'react'
import { useIsMobile } from '~shared/hooks/env/useIsMobile'
import { PlaceExplorerPageMobile } from './PlaceExplorerPage.mobile'

const PlaceExplorerPageDesktop = lazy(() =>
  import('./PlaceExplorerPage.desktop').then((m) => ({ default: m.PlaceExplorerPageDesktop }))
)

export const meta = () => [
  { title: '탐색 — WayLog' },
  { property: 'og:title', content: '탐색 — WayLog' },
]

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
