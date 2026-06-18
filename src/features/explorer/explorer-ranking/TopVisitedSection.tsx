import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { Box, Button, Skeleton, Stack, Typography } from '@mui/material'
import { useMemo } from 'react'
import { useNavigate } from 'react-router'
import { AppRoute } from '~app/routes'
import { useExplorerPlaceOverlay } from '../useExplorerPlaceOverlay'
import { useExplorerFilterParams } from '../explorer-filters/useExplorerFilterParams'
import { PlaceListItem } from '../explorer-place-item/PlaceListItem'
import { buildExplorerDetailUrl } from '../explorer.utils'
import { useExploredPlaces } from './useExploredPlaces'
import { SECTION_LIMIT, MOBILE_SKELETON_ROWS, formatVisitorCount } from './topVisitedSection.constants'
import { useIsMobile } from '~shared/hooks/env/useIsMobile'

export function TopVisitedSection() {
  const { location, category } = useExplorerFilterParams()
  const { data: places } = useExploredPlaces(location, category)
  const { openFullScreen, openSideSheet } = useExplorerPlaceOverlay()
  const navigate = useNavigate()

  const mostVisitedPlaces = useMemo(
    () => places.toSorted((a, b) => b.visitorCount - a.visitorCount).slice(0, SECTION_LIMIT),
    [places],
  )
  const toDetailUrl = buildExplorerDetailUrl(AppRoute.장소_최다방문순, location, category)
  const isMobile = useIsMobile();

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" px={2} mb={1.5}>
        <Typography variant="subtitle1">가장 많이 방문하는 곳이에요</Typography>
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

      {mostVisitedPlaces.length === 0 && (
        <Typography variant="body2" color="text.secondary" px={2} py={4} textAlign="center">
          자료를 찾을 수 없어요
        </Typography>
      )}

      <Stack>
        {mostVisitedPlaces.map((place) => (
          <PlaceListItem
            key={place.placeId}
            place={{ ...place, countLabel: formatVisitorCount(place.visitorCount) }}
            onClick={() => isMobile ? openFullScreen(place) : openSideSheet(place)}
            size={isMobile ? 'small' : 'large'}
          />
        ))}
      </Stack>
    </Box>
  )
}

TopVisitedSection.Skeleton = () => (
  <Box>
    <Skeleton variant="text" width={100} height={28} sx={{ mx: 2, mb: 1.5 }} />
    {Array.from({ length: MOBILE_SKELETON_ROWS }).map((_, i) => (
      <PlaceListItem.Skeleton key={i} />
    ))}
  </Box>
)
