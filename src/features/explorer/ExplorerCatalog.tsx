import { Stack } from '@mui/material'
import { Suspense } from 'react'
import type { Location } from '~features/location'
import type { PlaceCategoryType } from '~features/place/place.types'
import { TopVisitedSection } from './explorer-ranking/TopVisitedSection'
import { RecentHotSection } from './explorer-recent/RecentHotSection'
import { MostSavedSection } from './explorer-saved/MostSavedSection'

interface ExplorerCatalogProps {
  location?: Location
  category?: PlaceCategoryType
}

export function ExplorerCatalog({ location, category }: ExplorerCatalogProps) {
  return (
    <Stack gap={3} py={2}>
      <Suspense fallback={<RecentHotSection.Skeleton />}>
        <RecentHotSection location={location} category={category} />
      </Suspense>
      <Suspense fallback={<MostSavedSection.Skeleton />}>
        <MostSavedSection location={location} category={category} />
      </Suspense>
      <Suspense fallback={<TopVisitedSection.Skeleton />}>
        <TopVisitedSection location={location} category={category} />
      </Suspense>
    </Stack>
  )
}
