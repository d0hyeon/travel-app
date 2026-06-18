import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { Box, Button, Skeleton, Stack, Typography } from '@mui/material'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { AppRoute } from '~app/routes'
import { useIsMobile } from '~shared/hooks/env/useIsMobile'
import { useScrollRestore } from '~shared/hooks/interaction/useScrollRestore'
import { useExplorerFilterParams } from '../explorer-filters/useExplorerFilterParams'
import { PlaceCard } from '../explorer-place-item/PlaceCard'
import type { ExploredPlace } from '../explorer.api'
import { buildExplorerDetailUrl } from '../explorer.utils'
import { useExplorerPlaceOverlay } from '../useExplorerPlaceOverlay'
import { useRecentHotPlaces } from './useRecentHotPlaces'

const SECTION_LIMIT = 10

export function RecentHotSection() {
  const { location, category } = useExplorerFilterParams();
  const { data: places } = useRecentHotPlaces({ inquiryMonths: 3, location, category })
  const isMobile = useIsMobile()
  const { openFullScreen, openSideSheet } = useExplorerPlaceOverlay()
  const openDetail = (place: ExploredPlace) =>
    isMobile ? openFullScreen(place) : openSideSheet(place)
  const navigate = useNavigate()

  const topHotPlaces = useMemo(() => places.slice(0, SECTION_LIMIT), [places])
  const toDetailUrl = buildExplorerDetailUrl(AppRoute.장소_급상승, location, category)

  const [scrollContainer, setScrollContainer] = useState<HTMLDivElement | null>(null)
  useScrollRestore({ element: scrollContainer });

  return (
    <Box mb={3}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" px={2} mb={1.5}>
        <Typography variant="subtitle1" >최근 핫한 곳이에요</Typography>
        <Button
          size="small"
          variant="text"
          color="inherit"
          endIcon={<ChevronRightIcon sx={{ fontSize: '16px !important' }} />}
          onClick={() => navigate(toDetailUrl)}
          sx={{ minWidth: 0, fontSize: 12, color: 'text.secondary' }}
        >
          더보기
        </Button>
      </Stack>

      {topHotPlaces.length === 0 ? (
        <Typography variant="body2" color="text.secondary" px={2} py={4} textAlign="center">
          자료를 찾을 수 없어요
        </Typography>
      ) : (
        <Stack ref={setScrollContainer} width="100%" direction="row" gap={isMobile ? 1 : 2} px={2} pb={0.5} overflow="auto" sx={{ '&::-webkit-scrollbar': { display: 'none' } }}>
          {topHotPlaces.map((place) => (
            <Box key={place.placeId} sx={{ width: isMobile ? 140 : 200, flexShrink: 0 }}>
              <PlaceCard place={{ ...place, countLabel: `${place.visitorCount}번 방문` }} onClick={() => openDetail(place)} />
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  )
}

RecentHotSection.Skeleton = () => {
  const isMobile = useIsMobile();

  return (
    <Box mb={3}>
      <Skeleton variant="text" width={140} height={28} sx={{ mx: 2, mb: 1.5 }} />
      <Stack direction="row" gap={isMobile ? 1 : 2} px={2}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Box key={i} sx={{ width: isMobile ? 140 : 200, flexShrink: 0, borderRadius: 3, overflow: 'hidden', border: 1, borderColor: 'divider' }}>
            <Skeleton variant="rectangular" height={isMobile ? 140 : 200} />
            <Box p={1.5}>
              <Skeleton variant="text" width="80%" height={16} />
              <Skeleton variant="text" width={60} height={14} sx={{ mt: 0.5 }} />
            </Box>
          </Box>
        ))}
      </Stack>
    </Box>
  )
}