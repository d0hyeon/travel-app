import LocationOnIcon from '@mui/icons-material/LocationOn'
import PeopleIcon from '@mui/icons-material/People'
import { Box, Stack, Typography } from '@mui/material'
import { PlaceCategoryColorCode, PlaceCategoryTypeLabel } from '~features/place/place.types'
import type { ExploredPlace } from '../explorer.api'

export function PlaceListItem({ place, onClick }: { place: ExploredPlace; onClick: () => void }) {
  const accentColor = place.categories[0] ? PlaceCategoryColorCode[place.categories[0]] : undefined
  const categoryLabel = place.categories[0] ? PlaceCategoryTypeLabel[place.categories[0]] : null
  const subText = [categoryLabel, place.address].filter(Boolean).join(' · ')

  return (
    <Box
      component="button"
      onClick={onClick}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: 2,
        py: 1.25,
        border: 'none',
        bgcolor: 'transparent',
        textAlign: 'left',
        cursor: 'pointer',
        width: '100%',
        borderBottom: 1,
        borderColor: 'divider',
        '&:last-child': { borderBottom: 0 },
        '&:hover': { bgcolor: 'action.hover' },
      }}
    >
      <Box
        sx={{
          width: 64,
          height: 64,
          borderRadius: 2,
          flexShrink: 0,
          bgcolor: accentColor ? `${accentColor}22` : 'grey.100',
          backgroundImage: place.thumbnailUrl ? `url(${place.thumbnailUrl})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {!place.thumbnailUrl && (
          <LocationOnIcon sx={{ fontSize: 24, color: accentColor ?? 'text.disabled' }} />
        )}
      </Box>

      <Box flex={1} minWidth={0}>
        <Typography variant="body2" fontWeight={700} noWrap>
          {place.name}
        </Typography>
        {subText && (
          <Typography variant="caption" color="text.secondary" noWrap display="block">
            {subText}
          </Typography>
        )}
        <Stack direction="row" alignItems="center" gap={0.5} mt={0.5}>
          <PeopleIcon sx={{ fontSize: 11, color: 'primary.main' }} />
          <Typography variant="caption" color="primary" fontWeight={700}>
            {place.visitorCount}명 다녀옴
          </Typography>
        </Stack>
      </Box>
    </Box>
  )
}
