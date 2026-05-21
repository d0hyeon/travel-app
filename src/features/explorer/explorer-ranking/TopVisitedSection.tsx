import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { Box, Button, Stack, Typography } from '@mui/material'
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
  const toDetailUrl = buildDetailUrl(AppRoute.탐색_최다방문, location, category)

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
          <PlaceListItem key={place.placeId} place={place} onClick={() => openDetail(place)} />
        ))}
      </Stack>
    </Box>
  )
}

function buildDetailUrl(base: string, location?: Location | null, category?: PlaceCategoryType | null) {
  const params = new URLSearchParams()
  if (location) params.set('location', location)
  if (category) params.set('category', category)
  const qs = params.toString()
  return qs ? `${base}?${qs}` : base
}