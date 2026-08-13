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
      {/*
        외부 공공 API에 의존하므로 실패 시 섹션만 접고 나머지 탐색은 유지한다.
        단, 조용히 사라지면 장애를 눈치챌 수 없다. 서비스 키의 일일 호출 한도가
        소진되는 경우가 대표적이므로(사용자별 캐시라 방문자 수에 비례해 호출된다)
        원인을 남긴다.
      */}
      <ErrorBoundary
        fallback={() => null}
        onError={(error) => {
          console.error('[explorer] 계절 인기 여행지 섹션 로드 실패', error)
        }}
      >
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
