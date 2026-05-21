import { Box, Skeleton, Stack } from '@mui/material'
import { Suspense } from 'react'
import type { Location } from '~features/location'
import type { PlaceCategoryType } from '~features/place/place.types'
import { RecentHotSection } from './explorer-recent/RecentHotSection'
import { TopVisitedSection } from './explorer-ranking/TopVisitedSection'


interface ExplorerCatalogProps {
  location?: Location
  category?: PlaceCategoryType
}

export function ExplorerCatalog({ location, category }: ExplorerCatalogProps) {
  return (
    <Stack gap={3} py={2}>
      <Suspense fallback={<HorizontalSectionSkeleton />}>
        <RecentHotSection location={location ?? undefined} category={category ?? undefined} />
      </Suspense>
      <Suspense fallback={<ListSectionSkeleton />}>
        <TopVisitedSection location={location} category={category} />
      </Suspense>
    </Stack>
  )
}

function HorizontalSectionSkeleton() {
  return (
    <Box mb={3}>
      <Skeleton variant="text" width={140} height={28} sx={{ mx: 2, mb: 1.5 }} />
      <Stack direction="row" gap={1.5} px={2}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Box key={i} sx={{ width: 140, flexShrink: 0, borderRadius: 3, overflow: 'hidden', border: 1, borderColor: 'divider' }}>
            <Skeleton variant="rectangular" height={140} />
            <Box p={1.5}>
              <Skeleton variant="text" width="80%" height={16} />
              <Skeleton variant="text" width={60} height={14} sx={{ mt: 0.5 }} />
            </Box>
          </Box>
        ))}
      </Stack>
    </Box>
  )
}

function ListSectionSkeleton() {
  return (
    <Box>
      <Skeleton variant="text" width={100} height={28} sx={{ mx: 2, mb: 1.5 }} />
      {Array.from({ length: 5 }).map((_, i) => (
        <Stack key={i} direction="row" gap={1.5} px={2} py={1.25} alignItems="center">
          <Skeleton variant="rounded" width={64} height={64} sx={{ borderRadius: 2, flexShrink: 0 }} />
          <Box flex={1}>
            <Skeleton variant="text" width="60%" height={16} />
            <Skeleton variant="text" width="80%" height={14} />
            <Skeleton variant="text" width={80} height={14} sx={{ mt: 0.5 }} />
          </Box>
        </Stack>
      ))}
    </Box>
  )
}
