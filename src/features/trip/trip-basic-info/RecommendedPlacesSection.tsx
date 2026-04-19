import RoomIcon from '@mui/icons-material/Room'
import { Box, Chip, Skeleton, Stack, Typography, type StackProps } from '@mui/material'
import { Suspense, type ReactNode } from 'react'
import { useIsMobile } from '~shared/hooks/env/useIsMobile'
import { PlaceCategoryColorCode } from '../../place/place.types'
import type { RecommendedPlace } from '../../place/recommended-place.api'
import { useRecommendedPlaceDetailOverlay } from '../trip-place/RecommendedPlaceDetailOverlay'
import { useRecommendedPlaces } from '../trip-place/useRecommendedPlaces'

interface Props extends StackProps {
  tripId: string
  header?: ReactNode;
}

export function RecommendedPlacesSection(props: Props) {
  return (
    <Suspense fallback={<RecommendedPlacesSkeleton {...props} />}>
      <RecommendedPlacesSectionContent {...props} />
    </Suspense>
  )
}

function RecommendedPlacesSectionContent({ tripId, header, sx, ...props }: Props) {
  const { data: places } = useRecommendedPlaces(tripId)
  const { openDialog, openBottomSheet } = useRecommendedPlaceDetailOverlay()
  const isMobile = useIsMobile()

  if (places.length === 0) return null

  const handlePlaceClick = (place: RecommendedPlace) => {
    if (isMobile) openBottomSheet({ place, tripId })
    else openDialog({ place, tripId })
  }

  return (
    <Stack gap={1}>
      {header}
      <Stack
        direction="row"
        spacing={1.5}
        width="100%"
        sx={[
          { overflowX: 'auto', pb: 0.5, '::-webkit-scrollbar': { display: 'none' } },
          ...(Array.isArray(sx) ? sx : [sx])
        ]}
        {...props}
      >
        {places.map(place => (
          <RecommendedPlaceCard key={place.id} place={place} onClick={() => handlePlaceClick(place)} />
        ))}
      </Stack>
    </Stack>
  )
}

function RecommendedPlaceCard({
  place,
  onClick,
}: {
  place: RecommendedPlace
  onClick: () => void
}) {
  const accentColor = place.category ? PlaceCategoryColorCode[place.category] : undefined

  return (
    <Box
      onClick={onClick}
      sx={{
        width: 110,
        flexShrink: 0,
        cursor: 'pointer',
        borderRadius: 1,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        '&:hover': { borderColor: accentColor ?? 'primary.main', boxShadow: 1 },
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}
    >
      <Box sx={{ position: 'relative' }}>
        <Box
          sx={{
            width: '100%',
            height: 72,
            bgcolor: accentColor ? `${accentColor}22` : 'grey.100',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {place.photos[0] ? (
            <Box
              component="img"
              src={place.photos[0]}
              sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <RoomIcon sx={{ color: accentColor ?? 'text.disabled', fontSize: 28 }} />
          )}
        </Box>
        {place.tripCount > 1 && (
          <Chip
            label={`${place.tripCount}회`}
            size="small"
            sx={{
              position: 'absolute',
              top: 4,
              right: 4,
              height: 18,
              fontSize: 10,
              bgcolor: 'rgba(0,0,0,0.55)',
              color: '#fff',
              '.MuiChip-label': { px: 0.75 },
            }}
          />
        )}
      </Box>
      <Box sx={{ p: 0.75 }}>
        <Typography variant="caption" fontWeight="medium" noWrap display="block">
          {place.name}
        </Typography>
      </Box>
    </Box>
  )
}

function RecommendedPlacesSkeleton() {
  return (
    <Stack spacing={1} width="100%">
      <Skeleton variant="text" width={60} height={20} />
      <Stack direction="row" spacing={1.5}>
        {[0, 1, 2].map(i => (
          <Skeleton key={i} variant="rounded" width={110} height={96} />
        ))}
      </Stack>
    </Stack>
  )
}
