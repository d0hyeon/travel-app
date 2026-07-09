import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { Box, Button, Skeleton, Stack, Typography, type ButtonProps } from '@mui/material'
import { useMemo } from 'react'
import { generatePath, Link } from 'react-router'
import { AppRoute } from '~app/routes'
import { PlaceFullScreenModal } from '~features/place/place-detail/PlaceFullScreenModal'
import { PlaceSidePanel } from '~features/place/place-detail/PlaceSidePanel'
import { Scrollable } from '~shared/components/Scrollable'
import { useIsMobile } from '~shared/hooks/env/useIsMobile'
import { useRouteOverlay } from '~shared/hooks/extends/route-overlay/useRouteOverlay'
import { useExplorerFilterParams } from '../explorer-filters/useExplorerFilterParams'
import { PlaceCard } from '../explorer-place-item/PlaceCard'
import { buildExplorerDetailUrl } from '../explorer.utils'
import { useMostSavedPlaces } from './useMostSavedPlaces'

const SECTION_LIMIT = 10

export function MostSavedSection() {
  const { location, category } = useExplorerFilterParams();
  const { data: places } = useMostSavedPlaces({ location, category })
  const isMobile = useIsMobile()
  const { Link: PlaceOverlayLink } = useRouteOverlay(
    (placeId: string) => generatePath(AppRoute.장소_상세, { placeId }),
    ({ isOpen, close, data: placeId }) => (
      isMobile
        ? <PlaceFullScreenModal placeId={placeId} onClose={close} isOpen={isOpen} />
        : <PlaceSidePanel placeId={placeId} onClose={close} isOpen={isOpen} />
    )
  );

  const topSaved = useMemo(() => places.slice(0, SECTION_LIMIT), [places])

  return (
    <Box mb={3}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" px={2} mb={1.5}>
        <Typography variant="subtitle1">많이 저장된 곳이에요</Typography>
        <MoreButtonLink>더보기</MoreButtonLink>
      </Stack>

      {topSaved.length === 0 ? (
        <Typography variant="body2" color="text.secondary" px={2} py={4} textAlign="center">
          자료를 찾을 수 없어요
        </Typography>
      ) : (
        <Scrollable.Horizontal
          width="100%"
          gap={isMobile ? 1 : 2}
          px={2}
          pb={0.5}
          sx={{ '&::-webkit-scrollbar': { display: 'none' } }}
          restorable={`most-saved-section:${location}:${category}`}
        >

          {topSaved.map((place) => (
            <Box key={place.placeId} sx={{ width: isMobile ? 140 : 200, flexShrink: 0 }}>
              <PlaceOverlayLink key={place.placeId} data={place.placeId}>
                <PlaceCard
                  place={{ ...place, countLabel: `${place.saveCount}번 저장됨` }}
                />
              </PlaceOverlayLink>
            </Box>
          ))}
        </Scrollable.Horizontal>
      )}
    </Box>
  )
}

function MoreButtonLink(props: ButtonProps) {
  const { location, category } = useExplorerFilterParams();

  return (
    <Button
      size="small"
      variant="text"
      color="inherit"
      component={Link}
      to={buildExplorerDetailUrl(AppRoute.장소_저장순, location, category)}
      endIcon={<ChevronRightIcon sx={{ fontSize: '16px !important' }} />}
      sx={{ minWidth: 0, fontSize: 12, color: 'text.secondary' }}
      viewTransition
      {...props}
    />
  )
}


MostSavedSection.Skeleton = MostSavedSectionSkeleton;
function MostSavedSectionSkeleton() {
  const isMobile = useIsMobile()

  return (
    <Box mb={3}>
      <Skeleton variant="text" width={140} height={28} sx={{ mx: 2, mb: 1.5 }} />
      <Stack direction="row" gap={isMobile ? 1 : 2} px={2}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Box
            key={i}
            sx={{
              width: isMobile ? 140 : 200,
              flexShrink: 0,
              borderRadius: 3,
              overflow: 'hidden',
              border: 1,
              borderColor: 'divider',
            }}
          >
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