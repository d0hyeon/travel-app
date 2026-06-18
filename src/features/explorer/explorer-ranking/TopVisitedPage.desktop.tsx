import { Box, Container, Grid, Skeleton, Stack } from '@mui/material'
import { Suspense } from 'react'
import { getCoordinateByLocation, type Location } from '~features/location'
import type { PlaceCategoryType } from '~features/place/place.types'
import { TopNavigation } from '~shared/components/layout/TopNavigation.mobile'
import { Map } from '~shared/components/Map'
import { SwitchCase } from '~shared/components/SwitchCase'
import { useIsMobile } from '~shared/hooks/env/useIsMobile'
import { useExplorerDetailOverlay } from '../explorer-detail/useExplorerDetailOverlay'
import { ExplorerFilters } from '../explorer-filters/ExplorerFilters.desktop'
import { useExplorerFilterParams } from '../explorer-filters/useExplorerFilterParams'
import { PlaceListItem } from '../explorer-place-item/PlaceListItem'
import { ExplorerViewToggleButton, useExplorerViewMode } from '../explorer-view/ExplorerViewToggleButton'
import { useExploredPlaces } from './useExploredPlaces'


export default function TopVisitedPage() {
  const { location, category } = useExplorerFilterParams()
  const [viewMode, setViewMode] = useExplorerViewMode()

  return (
    <Box height="100%" display="flex" flexDirection="column" bgcolor="background.paper">
      <TopNavigation
        position="sticky"
        rightElement={<ExplorerViewToggleButton value={viewMode} onChange={setViewMode} />}
        sx={{ borderBottom: 'none', paddingBottom: 0 }}
      >
        최다 방문
      </TopNavigation>

      <Stack direction="row" gap={1} alignItems="center" px={2} py={1} borderBottom={1} borderColor="divider" flexShrink={0}>
        <ExplorerFilters.LocationChip />
        <ExplorerFilters.CategoryChip />
      </Stack>

      <Box
        flex={1}
        overflow="auto"
        position="relative"
      >
        <SwitchCase
          value={viewMode}
          cases={{
            list: () => (
              <Box py={2}>
                <Container maxWidth="md">
                  <Suspense fallback={<TopVisiteList.Pending />}>
                    <TopVisiteList location={location} category={category} />
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

function TopVisiteList({
  location,
  category,
}: {
  location?: Location
  category?: PlaceCategoryType
}) {
  const { openSideSheet } = useExplorerDetailOverlay()
  const { data: places } = useExploredPlaces(location, category)
  return (
    <Stack>
      {places.map((place) => (
        <PlaceListItem
          id={place.placeId}
          place={{ ...place, countLabel: `${place.visitorCount}번 저장됨` }}
          size="large"
          onClick={() => openSideSheet(place)}
        />

      ))}
    </Stack>
  )
}
TopVisiteList.Pending = () => {
  return (
    <>
      {Array.from({ length: 10 }).map((_, i) => (
        <PlaceListItem.Skeleton key={i} />
      ))}

    </>
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
  const isMobile = useIsMobile()
  const { openFullScreen, openSideSheet } = useExplorerDetailOverlay()
  const center = location ? getCoordinateByLocation(location) : undefined;

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
          color={place.visitorCount >= 2 ? '#ff6b35' : '#1976d2'}
          thumbnailUrl={place.thumbnailUrl}
          onClick={() => isMobile ? openFullScreen(place) : openSideSheet(place)}
        />
      ))}
    </Map>
  )
}

