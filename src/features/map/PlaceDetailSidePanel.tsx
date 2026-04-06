import CloseIcon from '@mui/icons-material/Close'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import {
  Box,
  CircularProgress,
  Divider,
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

export function PlaceDetailSidePanel({ place, trip, color, onClose }: Props) {
  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        width: 320,
        bgcolor: 'background.paper',
        boxShadow: 4,
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* 헤더 */}
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" p={2} pb={1.5}>
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
          {place.scheduledDate && (
            <Typography variant="caption" color="text.secondary" display="block" mt={0.25}>
              {place.scheduledDate}
            </Typography>
          )}
        </Box>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Stack>

      {/* 메모 */}
      {place.memo && (
        <>
          <Divider />
          <Typography variant="body2" color="text.secondary" px={2} py={1.5}>
            {place.memo}
          </Typography>
        </>
      )}

      <Divider />

      {/* 사진 */}
      <Box flex={1} overflow="auto" p={2}>
        <Suspense fallback={<Box display="flex" justifyContent="center"><CircularProgress size={20} /></Box>}>
          <PlacePhotos placeId={place.id} />
        </Suspense>
      </Box>
    </Box>
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
    <ImageList cols={2} gap={6} sx={{ m: 0 }}>
      {photos.map(photo => (
        <ImageListItem key={photo.id} sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <img src={photo.url} alt="" loading="lazy" style={{ aspectRatio: '1', objectFit: 'cover', width: '100%' }} />
        </ImageListItem>
      ))}
    </ImageList>
  )
}
