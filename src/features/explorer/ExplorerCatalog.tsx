import { Stack } from '@mui/material'
import { Suspense } from 'react'
import { TopVisitedSection } from './explorer-ranking/TopVisitedSection'
import { RecentHotSection } from './explorer-recent/RecentHotSection'
import { MostSavedSection } from './explorer-saved/MostSavedSection'

export function ExplorerCatalog() {
  return (
    <Stack gap={3} py={2}>
      <Suspense fallback={<RecentHotSection.Skeleton />}>
        <RecentHotSection />
      </Suspense>
      <Suspense fallback={<MostSavedSection.Skeleton />}>
        <MostSavedSection />
      </Suspense>
      <Suspense fallback={<TopVisitedSection.Skeleton />}>
        <TopVisitedSection />
      </Suspense>
    </Stack>
  )
}
