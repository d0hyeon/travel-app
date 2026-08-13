import { Stack } from '@mui/material'
import { Suspense } from 'react'
import { ErrorBoundary } from '~shared/components/ErrorBoundary'
import { TopVisitedSummarySection } from './explorer-ranking/TopVisitedSummarySection'
import { RecentHotSummarySection } from './explorer-recent/RecentHotSummarySection'
import { MostSavedSummarySection } from './explorer-saved/MostSavedSummarySection'
import { SeasonalRegionsSummarySection } from './explorer-seasonal-regions/SeasonalRegionsSummarySection'

export function ExplorerCatalog() {
  return (
    <Stack gap={3} py={2}>
      {/* 외부 공공 API에 의존하므로 실패 시 섹션만 접고 나머지 탐색은 유지한다 */}
      <ErrorBoundary fallback={() => null}>
        <Suspense fallback={<SeasonalRegionsSummarySection.Skeleton />}>
          <SeasonalRegionsSummarySection />
        </Suspense>
      </ErrorBoundary>
      <Suspense fallback={<RecentHotSummarySection.Skeleton />}>
        <RecentHotSummarySection />
      </Suspense>
      <Suspense fallback={<MostSavedSummarySection.Skeleton />}>
        <MostSavedSummarySection />
      </Suspense>
      <Suspense fallback={<TopVisitedSummarySection.Skeleton />}>
        <TopVisitedSummarySection />
      </Suspense>
    </Stack>
  )
}
