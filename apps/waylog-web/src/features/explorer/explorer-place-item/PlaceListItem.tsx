import LocationOnIcon from '@mui/icons-material/LocationOn'
import PeopleIcon from '@mui/icons-material/People'
import { Box, Skeleton, Stack, Typography, type BoxProps } from '@mui/material'
import type { PlaceCategoryType } from '~features/place/place.types'
import { PlaceCategoryColorCode, PlaceCategoryTypeLabel } from '~features/place/place.types'

interface Place {
  placeId: string
  name: string
  address: string
  categories: PlaceCategoryType[]
  thumbnailUrl?: string
  countLabel: string
}

interface Props extends BoxProps<'button'> {
  place: Place;
  size?: "small" | 'large';
}

export function PlaceListItem({ place, size = 'small', ...props }: Props) {
  const accentColor = place.categories[0] ? PlaceCategoryColorCode[place.categories[0]] : undefined
  const categoryLabel = place.categories[0] ? PlaceCategoryTypeLabel[place.categories[0]] : null
  const subText = [categoryLabel, place.address].filter(Boolean).join(' · ')

  return (
    <BaseItem size={size} {...props}>
      <Box
        width={size === 'small' ? 64 : 100}
        borderRadius={size === 'small' ? 2 : 4}
        bgcolor={accentColor ? `${accentColor}22` : 'grey.100'}
        sx={thumbnailStyles}
      >
        {place.thumbnailUrl ? (
          <img src={place.thumbnailUrl} />
        ) : (
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
            {place.countLabel}
          </Typography>
        </Stack>
      </Box>
    </BaseItem>
  )
}

PlaceListItem.Skeleton = ({ size, ...props }: Omit<Props, 'place'>) => {
  return (
    <BaseItem size={size} {...props}>
      <Box
        width={size === 'small' ? 64 : 100}
        borderRadius={size === 'small' ? 2 : 4}
        sx={thumbnailStyles}
      >
        <Skeleton height="100%" width="100%" />
      </Box>
      <Box flex={1} minWidth={0}>
        <Skeleton variant="text" height={18} />
        <Stack direction="row" alignItems="center" gap={0.5} mt={0.5}>
          <PeopleIcon sx={{ fontSize: 11, color: 'primary.main' }} />
          <Skeleton variant="text" height={12} />
        </Stack>
      </Box>
    </BaseItem>
  )
}

function BaseItem({ size, sx, children, ...props }: Omit<Props, 'place'>) {
  return (
    <Box
      component="button"
      sx={[
        {
          display: 'flex',
          alignItems: 'center',
          gap: size === 'small' ? 1.5 : 2,
          px: 2,
          py: size === 'small' ? 1.25 : 1.5,
          border: 'none',
          bgcolor: 'transparent',
          textAlign: 'left',
          cursor: 'pointer',
          width: '100%',
          borderBottom: 1,
          borderColor: 'divider',
          '&:last-child': { borderBottom: 0 },
          '&:hover': { bgcolor: 'action.hover' },
        },
        ...(Array.isArray(sx) ? sx : [sx])
      ]}
      {...props}
    >
      {children}
    </Box>
  )
}

const thumbnailStyles = {
  flexShrink: 0,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
  aspectRatio: '1 / 1'
}