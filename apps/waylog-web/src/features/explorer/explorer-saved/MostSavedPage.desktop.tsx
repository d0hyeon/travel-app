import { Box, Container, Stack } from '@mui/material'
import { Suspense } from 'react'
import { getCoordinateByLocation, type Location } from '@waylog/domains/modules/location'
import type { PlaceCategoryType } from '@waylog/domains/modules/place'
import { TopNavigation } from '~shared/components/layout/TopNavigation.mobile'
import { Map } from '~shared/components/Map'
import { SwitchCase } from '~shared/components/SwitchCase'
import { useExplorerPlaceSidePannel } from '../useExplorerPlaceOverlay'
import { ExplorerFilters } from '../explorer-filters/ExplorerFilters.desktop'
import { useExplorerFilterParams } from '../explorer-filters/useExplorerFilterParams'
import { PlaceListItem } from '../explorer-place-item/PlaceListItem'
import { ExplorerViewToggleButton, useExplorerViewMode } from '../explorer-view/ExplorerViewToggleButton'
import { useMostSavedPlaces } from './useMostSavedPlaces'

export default function MostSavedPage() {
  const { location, category } = useExplorerFilterParams()
  const [viewMode, setViewMode] = useExplorerViewMode()

  return (
    <Box height="100%" display="flex" flexDirection="column" bgcolor="background.paper">
      <TopNavigation
        position="sticky"
        rightElement={<ExplorerViewToggleButton value={viewMode} onChange={setViewMode} />}
        sx={{ borderBottom: 'none', paddingBottom: 0 }}
      >
        많이 저장된 곳
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
                  <Suspense fallback={<MostSavedList.Pending />}>
                    <MostSavedList location={location} category={category} />
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

function MostSavedList({
  location,
  category,
}: {
  location?: Location
  category?: PlaceCategoryType
}) {
  const { data: places } = useMostSavedPlaces({ location, category })
  const { Trigger } = useExplorerPlaceSidePannel();

  return (
    <Stack>
      {places.map((place) => (
        <Trigger key={place.placeId} placeId={place.placeId}>
          <PlaceListItem
            id={place.placeId}
            place={{ ...place, countLabel: `${place.saveCount}번 저장됨` }}
            size="large"
          />
        </Trigger>

      ))}
    </Stack>
  )
}
MostSavedList.Pending = () => {
  return (
    <>
      {Array.from({ length: 10 }).map((_, i) => (
        <PlaceListItem.Skeleton key={i} />
      ))}

    </>
  )
}

function MostSavedMap({
  location,
  category,
}: {
  location?: Location
  category?: PlaceCategoryType
}) {
  const { data: places } = useMostSavedPlaces({ location, category });
  const { open: openPlaceSidePanel } = useExplorerPlaceSidePannel();
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
          onClick={() => openPlaceSidePanel(place.placeId)}
        />
      ))}
    </Map>
  )
}


