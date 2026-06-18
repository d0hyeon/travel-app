import CheckIcon from '@mui/icons-material/Check'
import { Box, Chip, Container, Grid, Skeleton, Stack } from '@mui/material'
import { Suspense, useCallback, useRef, useState } from 'react'
import { getCoordinateByLocation, type Location } from '~features/location'
import type { PlaceCategoryType } from '~features/place/place.types'
import { BottomSheet } from '~shared/components/bottom-sheet/BottomSheet'
import { Extrude } from '~shared/components/animation/Extrude'
import { TopNavigation } from '~shared/components/layout/TopNavigation.mobile'
import { ListItem } from '~shared/components/ListItem'
import { Map } from '~shared/components/Map'
import { SwitchCase } from '~shared/components/SwitchCase'
import { useIsMobile } from '~shared/hooks/env/useIsMobile'
import { useScrollStatus } from '~shared/hooks/interaction/useScrollStatus'
import { useOverlay } from '~shared/hooks/useOverlay'
import { useExplorerPlaceOverlay } from '../useExplorerPlaceOverlay'
import { ExplorerFilters } from '../explorer-filters/ExplorerFilters.mobile'
import { useExplorerFilterParams } from '../explorer-filters/useExplorerFilterParams'
import { PlaceCard } from '../explorer-place-item/PlaceCard'
import { ExplorerViewToggleButton, useExplorerViewMode } from '../explorer-view/ExplorerViewToggleButton'
import { FilterNavigation } from '../explorer-view/FilterNavigation'
import type { ExploredPlace } from '../explorer.api'
import { useRecentHotPlaces } from './useRecentHotPlaces'
import { useOverlayRoute, type OverlayRouteRenderProps } from '~shared/hooks/extends/useOverlayRoute'
import { PlaceFullScreenModal } from '~features/place/place-detail/PlaceFullScreenModal'
import { generatePath } from 'react-router'
import { AppRoute } from '~app/routes'

const PERIOD_OPTIONS = [
  { label: '3개월', value: 3 },
  { label: '6개월', value: 6 },
  { label: '1년', value: 12 },
] as const

type PeriodMonths = (typeof PERIOD_OPTIONS)[number]['value']

const CHIP_SX = { fontSize: 11, height: 26 } as const

export default function RecentHotPage() {
  const [months, setMonths] = useState<PeriodMonths>(3)
  const { location, category } = useExplorerFilterParams()
  const [viewMode, setViewMode] = useExplorerViewMode()
  const openPeriodSheet = usePeriodBottomSheet(months, setMonths)

  const titleRef = useRef(null)
  const [container, setContainer] = useState<HTMLElement | null>(null)
  const { isScrollDown } = useScrollStatus(container)

  const currentPeriodLabel = PERIOD_OPTIONS.find((o) => o.value === months)?.label ?? ''


  return (
    <Box height="100%" display="flex" flexDirection="column" bgcolor="background.paper">
      <TopNavigation
        position="sticky"
        rightElement={<ExplorerViewToggleButton value={viewMode} onChange={setViewMode} />}
        sx={{ borderBottom: 'none' }}
      >
        <Box ref={titleRef} paddingX={1}>핫플레이스</Box>
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
            <Chip
              label={currentPeriodLabel}
              color={currentPeriodLabel ? 'primary' : 'default'}
              variant="outlined"
              size="small"
              onClick={openPeriodSheet}
              sx={{ ...CHIP_SX, fontWeight: category ? 700 : 400 }}
            />

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
                    <RecentHotGrid months={months} location={location ?? undefined} category={category ?? undefined} />
                  </Suspense>
                </Container>
              </Box>
            ),
            map: () => (
              <Suspense>
                <RecentHotMap months={months} location={location ?? undefined} category={category ?? undefined} />
              </Suspense>
            ),
          }}
        />
      </Box>
    </Box>
  )
}

function RecentHotGrid({
  months,
  location,
  category,
}: {
  months: PeriodMonths
  location?: Location
  category?: PlaceCategoryType
}) {
  const { data: places } = useRecentHotPlaces({ inquiryMonths: months, location, category })
  const { Link, back } = useOverlayRoute({
    component: ({ state: placeId, isOpen }: OverlayRouteRenderProps<string>) => (
      <PlaceFullScreenModal placeId={placeId} onClose={back} isOpen={isOpen} />
    )
  });


  return (

    <Grid container spacing={1.5} columns={2}>
      {places.map((place) => (
        <Grid key={place.placeId} size={1}>
          <Link
            key={place.placeId}
            state={place.placeId}
            to={generatePath(AppRoute.장소_상세, { placeId: place.placeId })}
          >
            <PlaceCard place={{ ...place, countLabel: `${place.visitorCount}번 방문` }} />
          </Link>
        </Grid>
      ))}
    </Grid>
  )
}

function RecentHotMap({
  months,
  location,
  category,
}: {
  months: PeriodMonths
  location?: Location
  category?: PlaceCategoryType
}) {

  const { data: places } = useRecentHotPlaces({ inquiryMonths: months, category, location })
  const { navigate, back } = useOverlayRoute({
    component: ({ state: placeId, isOpen, }: OverlayRouteRenderProps<string>) => (
      <PlaceFullScreenModal placeId={placeId} onClose={back} isOpen={isOpen} />
    )
  });
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
          onClick={() => navigate(generatePath(AppRoute.장소_상세, { placeId: place.placeId }), place.placeId)}
        />
      ))}
    </Map>
  )
}

function usePeriodBottomSheet(months: PeriodMonths, onSelect: (v: PeriodMonths) => void) {
  const overlay = useOverlay()

  return useCallback(() => {
    overlay.open(({ isOpen, close }) => (
      <BottomSheet isOpen={isOpen} onClose={close}>
        <BottomSheet.Header>기간 선택</BottomSheet.Header>
        <BottomSheet.Body>
          <Stack gap={1} pb={1}>
            {PERIOD_OPTIONS.map((opt) => (
              <ListItem.Button
                key={opt.value}
                onClick={() => { onSelect(opt.value); close() }}
                rightAddon={
                  opt.value === months
                    ? <CheckIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                    : undefined
                }
                sx={{ border: 'none' }}
              >
                <ListItem.Title fontWeight={opt.value === months ? 700 : 400}>
                  {opt.label}
                </ListItem.Title>
              </ListItem.Button>
            ))}
          </Stack>
        </BottomSheet.Body>
      </BottomSheet>
    ))
  }, [overlay, months, onSelect])
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
