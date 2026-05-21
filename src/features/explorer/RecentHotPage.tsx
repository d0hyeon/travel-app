import CheckIcon from '@mui/icons-material/Check'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import { Box, Button, Chip, Grid, Skeleton, Stack } from '@mui/material'
import { Suspense, useCallback, useMemo, useState } from 'react'
import type { Location } from '~features/location'
import type { PlaceCategoryType } from '~features/place/place.types'
import { PlaceCategoryTypeLabel } from '~features/place/place.types'
import { TopNavigation } from '~shared/components/layout/TopNavigation.mobile'
import { BottomSheet } from '~shared/components/bottom-sheet/BottomSheet'
import { ListItem } from '~shared/components/ListItem'
import { useIsMobile } from '~shared/hooks/env/useIsMobile'
import { useOverlay } from '~shared/hooks/useOverlay'
import type { ExploredPlace } from './explorer.api'
import { useExplorerDetailOverlay } from './explorer-detail/useExplorerDetailOverlay'
import { PlaceCard, useLocationOverlay, useCategoryBottomSheet } from './ExplorerCatalog'
import { useRecentHotPlaces } from './useRecentHotPlaces'

const PERIOD_OPTIONS = [
  { label: '3개월', value: 3 },
  { label: '6개월', value: 6 },
  { label: '1년', value: 12 },
] as const

type PeriodMonths = (typeof PERIOD_OPTIONS)[number]['value']

const CHIP_SX = { fontSize: 11, height: 26 } as const

export default function RecentHotPage() {
  const [months, setMonths] = useState<PeriodMonths>(3)
  const [location, setLocation] = useState<Location | null>(null)
  const [category, setCategory] = useState<PlaceCategoryType | null>(null)
  const openPeriodSheet = usePeriodBottomSheet(months, setMonths)
  const openLocationOverlay = useLocationOverlay()
  const openCategorySheet = useCategoryBottomSheet(category, setCategory)
  const currentLabel = PERIOD_OPTIONS.find((o) => o.value === months)?.label ?? ''

  const handleLocationClick = async () => {
    const result = await openLocationOverlay(location ?? undefined)
    if (result !== undefined) setLocation(result)
  }

  return (
    <Box height="100%" display="flex" flexDirection="column" bgcolor="background.paper">
      <TopNavigation
        rightElement={
          <Button
            size="small"
            variant="text"
            color="info"
            startIcon={<CalendarTodayIcon sx={{ fontSize: '14px !important' }} />}
            onClick={openPeriodSheet}
            sx={{ fontSize: 12 }}
          >
            {currentLabel}
          </Button>
        }
      >
        최근 핫플레이스
      </TopNavigation>
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
          <RecentHotGrid months={months} location={location} category={category} />
        </Suspense>
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
  location: Location | null
  category: PlaceCategoryType | null
}) {
  const { data: places } = useRecentHotPlaces(months, location, category)
  const isMobile = useIsMobile()
  const { openFullScreen, openSideSheet } = useExplorerDetailOverlay()
  const openDetail = (place: ExploredPlace) =>
    isMobile ? openFullScreen(place) : openSideSheet(place)

  const sorted = useMemo(() => places.toReversed(), [places])

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
