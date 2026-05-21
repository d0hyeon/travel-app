import { Box, Skeleton, Stack } from '@mui/material'
import { Suspense, useMemo } from 'react'
import { TopNavigation } from '~shared/components/layout/TopNavigation.mobile'
import { useIsMobile } from '~shared/hooks/env/useIsMobile'
import type { ExploredPlace } from './explorer.api'
import { useExplorerDetailOverlay } from './explorer-detail/useExplorerDetailOverlay'
import { PlaceListItem } from './ExplorerCatalog'
import { useExploredPlaces } from './useExploredPlaces'

export default function TopVisitedPage() {
  return (
    <Box height="100%" display="flex" flexDirection="column" bgcolor="background.paper">
      <TopNavigation>최다 방문</TopNavigation>
      <Box flex={1} overflow="auto" mt={`${TopNavigation.HEIGHT}px`}>
        <Suspense fallback={<ListSkeleton />}>
          <TopVisitedList />
        </Suspense>
      </Box>
    </Box>
  )
}

function TopVisitedList() {
  const { data: places } = useExploredPlaces()
  const isMobile = useIsMobile()
  const { openFullScreen, openSideSheet } = useExplorerDetailOverlay()
  const openDetail = (place: ExploredPlace) =>
    isMobile ? openFullScreen(place) : openSideSheet(place)

  const sorted = useMemo(
    () => places.toSorted((a, b) => b.visitorCount - a.visitorCount),
    [places],
  )

  return (
    <Stack>
      {sorted.map((place) => (
        <PlaceListItem key={place.placeId} place={place} onClick={() => openDetail(place)} />
      ))}
    </Stack>
  )
}

function ListSkeleton() {
  return (
    <Stack>
      {Array.from({ length: 10 }).map((_, i) => (
        <Stack key={i} direction="row" gap={1.5} px={2} py={1.25} alignItems="center">
          <Skeleton variant="rounded" width={64} height={64} sx={{ borderRadius: 2, flexShrink: 0 }} />
          <Box flex={1}>
            <Skeleton variant="text" width="60%" height={16} />
            <Skeleton variant="text" width="80%" height={14} />
            <Skeleton variant="text" width={80} height={14} sx={{ mt: 0.5 }} />
          </Box>
        </Stack>
      ))}
    </Stack>
  )
}
