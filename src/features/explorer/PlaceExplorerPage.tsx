import { lazy, Suspense } from 'react'
import { useIsMobile } from '~shared/hooks/env/useIsMobile'
import { PlaceExplorerPageMobile } from './PlaceExplorerPage.mobile'

const PlaceExplorerPageDesktop = lazy(() =>
  import('./PlaceExplorerPage.desktop').then((m) => ({ default: m.PlaceExplorerPageDesktop }))
)

export const meta = () => [
  { title: '장소 탐색 — WayLog' },
  { property: 'og:title', content: '장소 탐색 — WayLog' },
  { property: 'og:description', content: '여행자들이 많이 방문한 장소를 지도로 탐색해보세요.' },
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
