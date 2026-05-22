import LocationOnIcon from '@mui/icons-material/LocationOn'
import PeopleIcon from '@mui/icons-material/People'
import { Box, Card, CardActionArea, CardMedia, Stack, Typography } from '@mui/material'
import { PlaceCategoryColorCode } from '~features/place/place.types'
import type { ExploredPlace } from '../explorer.api'

export function PlaceCard({ place, onClick }: { place: ExploredPlace; onClick: () => void }) {
  const accentColor = place.categories[0] ? PlaceCategoryColorCode[place.categories[0]] : undefined

  return (
    <Card
      elevation={0}
      sx={{ borderRadius: 3, border: 1, borderColor: 'divider', overflow: 'hidden', width: '100%' }}
    >
      <CardActionArea onClick={onClick}>
        <CardMedia
          component="div"
          sx={{

            bgcolor: accentColor ? `${accentColor}22` : 'grey.100',
            backgroundImage: place.thumbnailUrl ? `url(${place.thumbnailUrl})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            aspectRatio: '1 / 1'
          }}
        >
          {!place.thumbnailUrl && (
            <LocationOnIcon sx={{ fontSize: 36, color: accentColor ?? 'text.disabled' }} />
          )}
        </CardMedia>
        <Box sx={{ p: 1.5 }}>
          <Typography variant="body2" fontWeight={700} noWrap title={place.name}>
            {place.name}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            {place.destinations.join(', ')}
          </Typography>
          <Stack direction="row" alignItems="center" gap={0.5} mt={0.5}>
            <PeopleIcon sx={{ fontSize: 11, color: 'primary.main' }} />
            <Typography variant="caption" color="primary" fontWeight={700}>
              {place.visitorCount}번 방문
            </Typography>
          </Stack>
        </Box>
      </CardActionArea>
    </Card>
  )
}
