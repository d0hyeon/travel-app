import CloseIcon from '@mui/icons-material/Close'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import {
  Box,
  CircularProgress,
  Drawer,
  IconButton,
  ImageList,
  ImageListItem,
  Stack,
  Typography,
} from '@mui/material'
import { Suspense } from 'react'
import type { Place } from '../place/place.types'
import type { Trip } from '../trip/trip.types'
import { usePlacePhotos } from './usePlacePhotos'

interface Props {
  place: Place
  trip: Trip | undefined
  color: string
  onClose: () => void
}

export function PlaceDetailBottomSheet({ place, trip, color, onClose }: Props) {
  return (
    <Drawer
      anchor="bottom"
      open
      onClose={onClose}
      PaperProps={{
        sx: {
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          maxHeight: '60dvh',
        }
      }}
    >
      <Box sx={{ overflowY: 'auto', pb: 3 }}>
        {/* 핸들 */}
        <Box display="flex" justifyContent="center" pt={1} pb={0.5}>
          <Box sx={{ width: 36, height: 4, borderRadius: 2, bgcolor: 'divider' }} />
        </Box>

        {/* 헤더 */}
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" px={2} pt={1}>
          <Box flex={1}>
            <Stack direction="row" alignItems="center" gap={0.5} mb={0.25}>
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />
              <Typography variant="caption" color="text.secondary">{trip?.name}</Typography>
            </Stack>
            <Typography variant="subtitle1" fontWeight={700}>{place.name}</Typography>
            {place.address && (
              <Stack direction="row" alignItems="center" gap={0.25} mt={0.25}>
                <LocationOnIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
                <Typography variant="caption" color="text.secondary">{place.address}</Typography>
              </Stack>
            )}
          </Box>
          <IconButton size="small" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>

        {/* 메모 */}
        {place.memo && (
          <Typography variant="body2" color="text.secondary" px={2} mt={1}>
            {place.memo}
          </Typography>
        )}

        {/* 사진 */}
        <Box mt={1.5} px={2}>
          <Suspense fallback={<CircularProgress size={20} />}>
            <PlacePhotos placeId={place.id} />
          </Suspense>
        </Box>
      </Box>
    </Drawer>
  )
}

function PlacePhotos({ placeId }: { placeId: string }) {
  const { data: photos } = usePlacePhotos(placeId)

  if (photos.length === 0) {
    return (
      <Typography variant="body2" color="text.disabled">사진이 없어요</Typography>
    )
  }

  return (
    <ImageList cols={3} gap={4} sx={{ m: 0 }}>
      {photos.map(photo => (
        <ImageListItem key={photo.id} sx={{ borderRadius: 1.5, overflow: 'hidden' }}>
          <img src={photo.url} alt="" loading="lazy" style={{ aspectRatio: '1', objectFit: 'cover', width: '100%' }} />
        </ImageListItem>
      ))}
    </ImageList>
  )
}
