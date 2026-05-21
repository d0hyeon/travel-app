import { Box, Chip, Grid, Skeleton, Stack } from '@mui/material'
import { Suspense, useMemo, useState } from 'react'
import type { Location } from '~features/location'
import type { PlaceCategoryType } from '~features/place/place.types'
import { PlaceCategoryTypeLabel } from '~features/place/place.types'
import { TopNavigation } from '~shared/components/layout/TopNavigation.mobile'
import { useIsMobile } from '~shared/hooks/env/useIsMobile'
import type { ExploredPlace } from './explorer.api'
import { useExplorerDetailOverlay } from './explorer-detail/useExplorerDetailOverlay'
import { PlaceCard, useLocationOverlay, useCategoryBottomSheet } from './ExplorerCatalog'
import { useExploredPlaces } from './useExploredPlaces'

const CHIP_SX = { fontSize: 11, height: 26 } as const

export default function TopVisitedPage() {
  const [location, setLocation] = useState<Location | null>(null)
  const [category, setCategory] = useState<PlaceCategoryType | null>(null)
  const openLocationOverlay = useLocationOverlay()
  const openCategorySheet = useCategoryBottomSheet(category, setCategory)

  const handleLocationClick = async () => {
    const result = await openLocationOverlay(location ?? undefined)
    if (result !== undefined) setLocation(result)
  }

  return (
    <Box height="100%" display="flex" flexDirection="column" bgcolor="background.paper">
      <TopNavigation>최다 방문</TopNavigation>
      <Box
        sx={{
          mt: `${TopNavigation.HEIGHT}px`,
          px: 1.5,
          py: 1,
          borderBottom: 1,
          borderColor: 'divider',
          flexShrink: 0,
        }}
      >
        <Stack direction="row" gap={1}>
          <Chip
            label={location ?? '지역'}
            onClick={handleLocationClick}
            color={location ? 'primary' : 'default'}
            variant="outlined"
            size="small"
            sx={{ ...CHIP_SX, fontWeight: location ? 700 : 400 }}
          />
          <Chip
            label={category ? PlaceCategoryTypeLabel[category] : '카테고리'}
            onClick={openCategorySheet}
            color={category ? 'primary' : 'default'}
            variant="outlined"
            size="small"
            sx={{ ...CHIP_SX, fontWeight: category ? 700 : 400 }}
          />
        </Stack>
      </Box>
      <Box flex={1} overflow="auto" px={2} py={2}>
        <Suspense fallback={<GridSkeleton />}>
          <TopVisitedGrid location={location} category={category} />
        </Suspense>
      </Box>
    </Box>
  )
}

function TopVisitedGrid({ location, category }: { location: Location | null; category: PlaceCategoryType | null }) {
  const { data: places } = useExploredPlaces(location, category)
  const isMobile = useIsMobile()
  const { openFullScreen, openSideSheet } = useExplorerDetailOverlay()
  const openDetail = (place: ExploredPlace) =>
    isMobile ? openFullScreen(place) : openSideSheet(place)

  const sorted = useMemo(
    () => places.toSorted((a, b) => b.visitorCount - a.visitorCount),
    [places],
  )

  return (
    <Grid container spacing={1.5}>
      {sorted.map((place) => (
        <Grid key={place.placeId} size={6}>
          <PlaceCard place={place} onClick={() => openDetail(place)} />
        </Grid>
      ))}
    </Grid>
  )
}

function GridSkeleton() {
  return (
    <Grid container spacing={1.5}>
      {Array.from({ length: 10 }).map((_, i) => (
        <Grid key={i} size={6}>
          <Box sx={{ borderRadius: 3, overflow: 'hidden', border: 1, borderColor: 'divider' }}>
            <Skeleton variant="rectangular" height={120} />
            <Box p={1.5}>
              <Skeleton variant="text" width="70%" height={16} />
              <Skeleton variant="text" width={60} height={14} sx={{ mt: 0.5 }} />
            </Box>
          </Box>
        </Grid>
      ))}
    </Grid>
  )
}
