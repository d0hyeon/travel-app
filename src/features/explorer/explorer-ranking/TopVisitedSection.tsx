import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { Box, Button, Skeleton, Stack, Typography } from '@mui/material'
import { useMemo } from 'react'
import { useNavigate } from 'react-router'
import { AppRoute } from '~app/routes'
import type { Location } from '~features/location'
import type { PlaceCategoryType } from '~features/place/place.types'
import { useIsMobile } from '~shared/hooks/env/useIsMobile'
import { useExplorerDetailOverlay } from '../explorer-detail/useExplorerDetailOverlay'
import { PlaceListItem } from '../explorer-place-item/PlaceListItem'
import { useExploredPlaces } from '../explorer-ranking/useExploredPlaces'
import type { ExploredPlace } from '../explorer.api'
import { buildExplorerDetailUrl } from '../explorer.utils'

const SECTION_LIMIT = 10

interface Props {
  location?: Location | null
  category?: PlaceCategoryType | null
}

export function TopVisitedSection({ location, category }: Props) {
  const { data: places } = useExploredPlaces(location, category)
  const isMobile = useIsMobile()
  const { openFullScreen, openSideSheet } = useExplorerDetailOverlay()
  const openDetail = (place: ExploredPlace) =>
    isMobile ? openFullScreen(place) : openSideSheet(place)
  const navigate = useNavigate()

  const topVisited = useMemo(
    () => places.toSorted((a, b) => b.visitorCount - a.visitorCount).slice(0, SECTION_LIMIT),
    [places],
  )
  const toDetailUrl = buildExplorerDetailUrl(AppRoute.탐색_최다방문, location, category)

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" px={2} mb={1.5}>
        <Typography variant="subtitle1" >가장 많이 방문하는 곳이에요</Typography>
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
      <Stack>
        {topVisited.length === 0 && (
          <Typography variant="body2" color="text.secondary" px={2} py={4} textAlign="center">
            자료를 찾을 수 없어요
          </Typography>
        )}
        {topVisited.map((place) => (
          <PlaceListItem
            key={place.placeId}
            place={{ ...place, countLabel: `${place.visitorCount}명 다녀옴` }}
            onClick={() => openDetail(place)}
          />
        ))}
      </Stack>
    </Box>
  )
}

TopVisitedSection.Skeleton = () => {
  return (
    <Box>
      <Skeleton variant="text" width={100} height={28} sx={{ mx: 2, mb: 1.5 }} />
      {Array.from({ length: 5 }).map((_, i) => (
        <Stack key={i} direction="row" gap={1.5} px={2} py={1.25} alignItems="center">
          <Skeleton variant="rounded" width={64} height={64} sx={{ borderRadius: 2, flexShrink: 0 }} />
          <Box flex={1}>
            <Skeleton variant="text" width="60%" height={16} />
            <Skeleton variant="text" width="80%" height={14} />
            <Skeleton variant="text" width={80} height={14} sx={{ mt: 0.5 }} />
          </Box>
        </Stack>
      ))}
    </Box>
  )
}

