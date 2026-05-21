import CheckIcon from '@mui/icons-material/Check'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import { Box, Button, Skeleton, Stack } from '@mui/material'
import { Suspense, useCallback, useMemo, useState } from 'react'
import { TopNavigation } from '~shared/components/layout/TopNavigation.mobile'
import { BottomSheet } from '~shared/components/bottom-sheet/BottomSheet'
import { ListItem } from '~shared/components/ListItem'
import { useIsMobile } from '~shared/hooks/env/useIsMobile'
import { useOverlay } from '~shared/hooks/useOverlay'
import type { ExploredPlace } from './explorer.api'
import { useExplorerDetailOverlay } from './explorer-detail/useExplorerDetailOverlay'
import { PlaceListItem } from './ExplorerCatalog'
import { useRecentHotPlaces } from './useRecentHotPlaces'

const PERIOD_OPTIONS = [
  { label: '3개월', value: 3 },
  { label: '6개월', value: 6 },
  { label: '1년', value: 12 },
] as const

type PeriodMonths = (typeof PERIOD_OPTIONS)[number]['value']

export default function RecentHotPage() {
  const [months, setMonths] = useState<PeriodMonths>(3)
  const openPeriodSheet = usePeriodBottomSheet(months, setMonths)
  const currentLabel = PERIOD_OPTIONS.find((o) => o.value === months)?.label ?? ''

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
      <Box flex={1} overflow="auto" mt={`${TopNavigation.HEIGHT}px`}>
        <Suspense fallback={<ListSkeleton />}>
          <RecentHotList months={months} />
        </Suspense>
      </Box>
    </Box>
  )
}

function RecentHotList({ months }: { months: PeriodMonths }) {
  const { data: places } = useRecentHotPlaces(months)
  const isMobile = useIsMobile()
  const { openFullScreen, openSideSheet } = useExplorerDetailOverlay()
  const openDetail = (place: ExploredPlace) =>
    isMobile ? openFullScreen(place) : openSideSheet(place)

  const sorted = useMemo(() => places.toReversed(), [places])

  return (
    <Stack>
      {sorted.map((place) => (
        <PlaceListItem key={place.placeId} place={place} onClick={() => openDetail(place)} />
      ))}
    </Stack>
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
