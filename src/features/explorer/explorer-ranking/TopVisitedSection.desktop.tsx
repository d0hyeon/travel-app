import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { Box, Button, Grid, Skeleton, Stack, Typography } from '@mui/material'
import { useMemo } from 'react'
import { useNavigate } from 'react-router'
import { AppRoute } from '~app/routes'
import { useExplorerDetailOverlay } from '../explorer-detail/useExplorerDetailOverlay'
import { useExplorerFilterParams } from '../explorer-filters/useExplorerFilterParams'
import { PlaceCard } from '../explorer-place-item/PlaceCard'
import { buildExplorerDetailUrl } from '../explorer.utils'
import { useExploredPlaces } from './useExploredPlaces'
import { SECTION_LIMIT, DESKTOP_SKELETON_CARDS, formatVisitorCount } from './topVisitedSection.constants'

export function TopVisitedSectionDesktop() {
  const { location, category } = useExplorerFilterParams()
  const { data: places } = useExploredPlaces(location, category)
  const { openSideSheet } = useExplorerDetailOverlay()
  const navigate = useNavigate()

  const mostVisitedPlaces = useMemo(
    () => places.toSorted((a, b) => b.visitorCount - a.visitorCount).slice(0, SECTION_LIMIT),
    [places],
  )
  const toDetailUrl = buildExplorerDetailUrl(AppRoute.장소_최다방문순, location, category)

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

      <Grid container spacing={2} px={2}>
        {mostVisitedPlaces.map((place) => (
          <Grid key={place.placeId} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
            <PlaceCard
              place={{
                ...place,
                countLabel: formatVisitorCount(place.visitorCount),
              }}
              onClick={() => openSideSheet(place)}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}

TopVisitedSectionDesktop.Skeleton = () => (
  <Box>
    <Skeleton variant="text" width={100} height={28} sx={{ mx: 2, mb: 1.5 }} />
    <Grid container spacing={2} px={2}>
      {Array.from({ length: DESKTOP_SKELETON_CARDS }).map((_, i) => (
        <Grid key={i} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
          <Box sx={{ borderRadius: 3, overflow: 'hidden', border: 1, borderColor: 'divider' }}>
            <Skeleton variant="rectangular" sx={{ aspectRatio: '1' }} />
            <Box p={1.5}>
              <Skeleton variant="text" width="80%" height={16} />
              <Skeleton variant="text" width={60} height={14} sx={{ mt: 0.5 }} />
            </Box>
          </Box>
        </Grid>
      ))}
    </Grid>
  </Box>
)
