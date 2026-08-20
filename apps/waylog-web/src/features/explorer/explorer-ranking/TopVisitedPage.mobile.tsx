import { Box, Container, Grid, Skeleton, Stack } from '@mui/material'
import { Suspense, useRef, useState } from 'react'
import { getCoordinateByLocation, type Location } from '@waylog/domains/location'
import type { PlaceCategoryType } from '@waylog/domains/place'
import { Extrude } from '~shared/components/animation/Extrude'
import { TopNavigation } from '~shared/components/layout/TopNavigation.mobile'
import { Map } from '~shared/components/Map'
import { SwitchCase } from '~shared/components/SwitchCase'
import { useIsMobile } from '~shared/hooks/env/useIsMobile'
import { useScrollStatus } from '~shared/hooks/interaction/useScrollStatus'
import { useExplorerPlaceModal, useExplorerPlaceSidePannel } from '../useExplorerPlaceOverlay'
import { ExplorerFilters } from '../explorer-filters/ExplorerFilters.mobile'
import { useExplorerFilterParams } from '../explorer-filters/useExplorerFilterParams'
import { PlaceCard } from '../explorer-place-item/PlaceCard'
import { ExplorerViewToggleButton, useExplorerViewMode } from '../explorer-view/ExplorerViewToggleButton'
import { FilterNavigation } from '../explorer-view/FilterNavigation'
import type { ExploredPlace } from '../explorer.api'
import { useExploredPlaces } from './useExploredPlaces'
import { useRouteOverlay } from '~shared/hooks/extends/route-overlay/useRouteOverlay'
import { AppRoute } from '~app/routes'
import { generatePath } from 'react-router';
import { PlaceFullScreenModal } from '~features/place/place-detail/PlaceFullScreenModal'


export default function TopVisitedPage() {
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
        <Box ref={titleRef} paddingX={1}>최다 방문</Box>
      </TopNavigation>

      <FilterNavigation
        height={isScrollDown ? 0 : 'auto'}
        paddingBottom={isScrollDown ? 0 : 1}
        sx={{ zIndex: 1000, transition: 'all 200ms', position: 'fixed', top: TopNavigation.HEIGHT }}
      >
        <Extrude active={isScrollDown} target={titleRef.current}>
          <Stack direction="row" gap={1} alignItems="center">
            <ExplorerFilters.LocationChip />
            <ExplorerFilters.CategoryChip />
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
                <Container maxWidth="sm" >
                  <Suspense fallback={<GridSkeleton />}>
                    <TopVisitedGrid location={location} category={category} />
                  </Suspense>
                </Container>
              </Box>
            ),
            map: () => (
              <Suspense>
                <TopVisitedMap location={location} category={category} />
              </Suspense>
            ),
          }}
        />

      </Box>
    </Box>
  )
}

function TopVisitedGrid({
  location,
  category,
}: {
  location?: Location
  category?: PlaceCategoryType
}) {
  const { data: places } = useExploredPlaces(location, category)
  const isMobile = useIsMobile()
  const { open: openPlaceModal } = useExplorerPlaceModal()
  const { open: openPlaceSidePanel } = useExplorerPlaceSidePannel()
  const openDetail = (place: ExploredPlace) =>
    isMobile ? openPlaceModal(place.placeId) : openPlaceSidePanel(place.placeId)

  const sorted = places.toSorted((a, b) => b.visitorCount - a.visitorCount)

  return (

    <Grid container spacing={1.5} columns={2}>
      {sorted.map((place) => (
        <Grid key={place.placeId} size={1}>
          <PlaceCard place={{ ...place, countLabel: `${place.visitorCount}번 방문` }} onClick={() => openDetail(place)} />
        </Grid>
      ))}
    </Grid>

  )
}

function TopVisitedMap({
  location,
  category,
}: {
  location?: Location
  category?: PlaceCategoryType
}) {
  const { data: places } = useExploredPlaces(location, category)
  const center = location ? getCoordinateByLocation(location) : undefined;

  const { open } = useRouteOverlay(
    (placeId: string) => generatePath(AppRoute.장소_상세, { placeId }),
    ({ isOpen, close, data: placeId }) => <PlaceFullScreenModal placeId={placeId} isOpen={isOpen} onClose={close} />
  );

  return (
    <Map
      type="google"
      sx={{ width: '100%', height: '100%' }}
      autoFocus="marker"
      clustering
      clusterGridSize={60}
      center={center}
    >
      {places.map((place) => (
        <Map.Marker
          key={place.placeId}
          id={place.placeId}
          lat={place.lat}
          lng={place.lng}
          label={place.name}
          color={place.visitorCount >= 2 ? '#ff6b35' : '#1976d2'}
          thumbnailUrl={place.thumbnailUrl}
          onClick={() => open(place.placeId)}
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
