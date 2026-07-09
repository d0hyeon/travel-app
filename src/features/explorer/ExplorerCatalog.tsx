import { Stack } from '@mui/material'
import { Suspense } from 'react'
import { TopVisitedSummarySection } from './explorer-ranking/TopVisitedSummarySection'
import { RecentHotSummarySection } from './explorer-recent/RecentHotSummarySection'
import { MostSavedSummarySection } from './explorer-saved/MostSavedSummarySection'

export function ExplorerCatalog() {
  return (
    <Stack gap={3} py={2}>
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
