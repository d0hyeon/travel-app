import { Box, Container, Grid, Skeleton, Stack } from '@mui/material'
import { Suspense, useRef, useState } from 'react'
import { getCoordinateByLocation, type Location } from '~features/location'
import type { PlaceCategoryType } from '~features/place/place.types'
import { Extrude } from '~shared/components/animation/Extrude'
import { TopNavigation } from '~shared/components/layout/TopNavigation.mobile'
import { Map } from '~shared/components/Map'
import { SwitchCase } from '~shared/components/SwitchCase'
import { useIsMobile } from '~shared/hooks/env/useIsMobile'
import { useScrollStatus } from '~shared/hooks/interaction/useScrollStatus'
import { useExplorerDetailOverlay } from '../explorer-detail/useExplorerDetailOverlay'
import { ExplorerFilter } from '../explorer-filters/ExplorerFilters'
import { useExplorerFilterParams } from '../explorer-filters/useExplorerFilterParams'
import { PlaceCard } from '../explorer-place-item/PlaceCard'
import { ExplorerViewToggleButton, useExplorerViewMode } from '../explorer-view/ExplorerViewToggleButton'
import { FilterNavigation } from '../explorer-view/FilterNavigation'
import type { MostSavedPlace } from '../explorer.api'
import { useMostSavedPlaces } from './useMostSavedPlaces'

export default function MostSavedPage() {
  const { location, category } = useExplorerFilterParams()
  const [viewMode, setViewMode] = useExplorerViewMode()

  const titleRef = useRef(null)
  const [container, setContainer] = useState<HTMLElement | null>(null)
  const { isScrollDown } = useScrollStatus(container)

  return (
    <Box height="100%" display="flex" flexDirection="column" bgcolor="background.paper">
      <TopNavigation
        position="sticky"
        rightElement={<ExplorerViewToggleButton value={viewMode} onChange={setViewMode} />}
        sx={{ borderBottom: 'none' }}
      >
        <Box ref={titleRef} paddingX={1}>많이 저장된 곳</Box>
      </TopNavigation>

      <FilterNavigation
        height={isScrollDown ? 0 : 'auto'}
        paddingBottom={isScrollDown ? 0 : 1}
        sx={{ zIndex: 1000, transition: 'all 200ms', position: 'fixed', top: TopNavigation.HEIGHT }}
      >
        <Extrude active={isScrollDown} target={titleRef.current} >
          <Stack direction="row" gap={1} alignItems="center">
            <ExplorerFilter.LocationChip />
            <ExplorerFilter.CategoryChip />
          </Stack>
        </Extrude>
      </FilterNavigation>

      <Box
        ref={setContainer}
        flex={1}
        overflow="auto"
        paddingTop={`${FilterNavigation.height}px`}
        position="relative"
      >
        <SwitchCase
          value={viewMode}
          cases={{
            list: () => (
              <Box py={2}>
                <Container maxWidth="sm">
                  <Suspense fallback={<GridSkeleton />}>
                    <MostSavedGrid location={location} category={category} />
                  </Suspense>
                </Container>
              </Box>
            ),
            map: () => (
              <Suspense>
                <MostSavedMap location={location} category={category} />
              </Suspense>
            ),
          }}
        />
      </Box>
    </Box>
  )
}

function MostSavedGrid({
  location,
  category,
}: {
  location?: Location
  category?: PlaceCategoryType
}) {
  const { data: places } = useMostSavedPlaces({ location, category })
  const isMobile = useIsMobile()
  const { openFullScreen, openSideSheet } = useExplorerDetailOverlay()
  const openDetail = (place: MostSavedPlace) =>
    isMobile ? openFullScreen(place) : openSideSheet(place)

  return (
    <Grid container spacing={1.5} columns={2}>
      {places.map((place) => (
        <Grid key={place.placeId} size={1}>
          <PlaceCard place={{ ...place, countLabel: `${place.saveCount}번 저장됨` }} onClick={() => openDetail(place)} />
        </Grid>
      ))}
    </Grid>
  )
}

function MostSavedMap({
  location,
  category,
}: {
  location?: Location
  category?: PlaceCategoryType
}) {
  const { data: places } = useMostSavedPlaces({ location, category })
  const isMobile = useIsMobile()
  const { openFullScreen, openSideSheet } = useExplorerDetailOverlay()
  const center = location ? getCoordinateByLocation(location) : undefined

  return (
    <Map
      type="google"
      sx={{ width: '100%', height: '100%' }}
      autoFocus="marker"
      clustering
      clusterGridSize={60}
      defaultCenter={center}
    >
      {places.map((place) => (
        <Map.Marker
          key={place.placeId}
          id={place.placeId}
          lat={place.lat}
          lng={place.lng}
          label={place.name}
          color={place.saveCount >= 2 ? '#ff6b35' : '#1976d2'}
          thumbnailUrl={place.thumbnailUrl}
          onClick={() => isMobile ? openFullScreen(place) : openSideSheet(place)}
        />
      ))}
    </Map>
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
