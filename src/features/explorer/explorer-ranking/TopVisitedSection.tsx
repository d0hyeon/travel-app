import { lazy, Suspense } from 'react'
import { useIsMobile } from '~shared/hooks/env/useIsMobile'
import { TopVisitedSectionMobile } from './TopVisitedSection.mobile'

const TopVisitedSectionDesktop = lazy(() =>
  import('./TopVisitedSection.desktop').then((m) => ({ default: m.TopVisitedSectionDesktop })),
)

export function TopVisitedSection() {
  const isMobile = useIsMobile()

  if (isMobile) {
    return <TopVisitedSectionMobile />
  }

  return (
    <Suspense fallback={<TopVisitedSectionMobile.Skeleton />}>
      <TopVisitedSectionDesktop />
    </Suspense>
  )
}

TopVisitedSection.Skeleton = TopVisitedSectionMobile.Skeleton
