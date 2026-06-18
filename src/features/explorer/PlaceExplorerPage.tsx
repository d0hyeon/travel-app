import { Suspense } from 'react'
import { useIsMobile } from '~shared/hooks/env/useIsMobile'
import { PlaceExplorerPage as PlaceExplorerPageDesktop } from './PlaceExplorerPage.desktop'
import { PlaceExplorerPage as PlaceExplorerPageMobile } from './PlaceExplorerPage.mobile'


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
