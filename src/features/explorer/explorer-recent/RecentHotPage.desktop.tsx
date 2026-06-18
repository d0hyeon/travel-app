import CheckIcon from '@mui/icons-material/Check'
import { Box, Button, Chip, Container, Dialog, DialogActions, DialogContent, Stack } from '@mui/material'
import { Suspense, useCallback, useState } from 'react'
import { getCoordinateByLocation, type Location } from '~features/location'
import type { PlaceCategoryType } from '~features/place/place.types'
import { DialogTitle } from '~shared/components/confirm-dialog/DialogTitle'
import { TopNavigation } from '~shared/components/layout/TopNavigation.mobile'
import { ListItem } from '~shared/components/ListItem'
import { Map } from '~shared/components/Map'
import { SwitchCase } from '~shared/components/SwitchCase'
import { useIsMobile } from '~shared/hooks/env/useIsMobile'
import { useOverlay } from '~shared/hooks/useOverlay'
import { useExplorerDetailOverlay } from '../explorer-detail/useExplorerDetailOverlay'
import { ExplorerFilters } from '../explorer-filters/ExplorerFilters.desktop'
import { useExplorerFilterParams } from '../explorer-filters/useExplorerFilterParams'
import { PlaceListItem } from '../explorer-place-item/PlaceListItem'
import { ExplorerViewToggleButton, useExplorerViewMode } from '../explorer-view/ExplorerViewToggleButton'
import { useRecentHotPlaces } from './useRecentHotPlaces'

const PERIOD_OPTIONS = [
  { label: '3개월', value: 3 },
  { label: '6개월', value: 6 },
  { label: '1년', value: 12 },
] as const

const CHIP_SX = { fontSize: 11, height: 26 } as const

export default function RecentHotPage() {
  const [months, setMonths] = useState<number>(3)
  const { location, category } = useExplorerFilterParams()
  const [viewMode, setViewMode] = useExplorerViewMode()
  const currentPeriodLabel = PERIOD_OPTIONS.find((o) => o.value === months)?.label ?? ''
  const selectPeriod = usePeriodOverlay()

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
        <Chip
          label={currentPeriodLabel}
          color={currentPeriodLabel ? 'primary' : 'default'}
          variant="outlined"
          size="small"
          onClick={async () => {
            const period = await selectPeriod();
            if (period) setMonths(period);
          }}
          sx={{ ...CHIP_SX, fontWeight: category ? 700 : 400 }}
        />
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
                  <Suspense fallback={<RecentHotList.Pending />}>
                    <RecentHotList months={months} location={location} category={category} />
                  </Suspense>
                </Container>
              </Box>
            ),
            map: () => (
              <Suspense>
                <RecentHotMap months={months} location={location} category={category} />
              </Suspense>
            ),
          }}
        />
      </Box>
    </Box>
  )
}


function RecentHotList({
  months,
  location,
  category,
}: {
  months: number
  location?: Location
  category?: PlaceCategoryType
}) {
  const { data: places } = useRecentHotPlaces({ inquiryMonths: months, location, category })
  const { openSideSheet } = useExplorerDetailOverlay()

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

RecentHotList.Pending = () => {
  return (
    <>
      {Array.from({ length: 10 }).map((_, i) => (
        <PlaceListItem.Skeleton key={i} />
      ))}

    </>
  )
}


function RecentHotMap({
  months,
  location,
  category,
}: {
  months: number
  location?: Location
  category?: PlaceCategoryType
}) {

  const { data: places } = useRecentHotPlaces({ inquiryMonths: months, category, location })
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

function usePeriodOverlay() {
  const overlay = useOverlay()

  return useCallback((defaultValue?: number) => {
    return new Promise<number | null>(resolve => {
      overlay.open(({ isOpen, close }) => (
        <Dialog open={isOpen}>
          <DialogTitle>기간 선택</DialogTitle>
          <DialogContent>
            <Stack gap={1} pb={1}>
              {PERIOD_OPTIONS.map((opt) => (
                <ListItem.Button
                  key={opt.value}
                  onClick={() => {
                    resolve(opt.value)
                    close();
                  }}
                  rightAddon={
                    opt.value === defaultValue
                      ? <CheckIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                      : undefined
                  }
                  sx={{ border: 'none' }}
                >
                  <ListItem.Title fontWeight={opt.value === defaultValue ? 700 : 400}>
                    {opt.label}
                  </ListItem.Title>
                </ListItem.Button>
              ))}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button
              variant="contained"
              onClick={() => {
                resolve(null);
                close();
              }}
            >
              닫기
            </Button>
          </DialogActions>
        </Dialog>
      ))
    })

  }, [overlay])
}
