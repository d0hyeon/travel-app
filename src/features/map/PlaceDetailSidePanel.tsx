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
import { usePlacePhotos } from './usePlacePhotos'
import { useOverlay } from '~shared/hooks/useOverlay'
import { PhotoBottomSheet } from '~shared/components/photo/PhotoBottomSheet'

interface Props {
  place: Place
  isOpen?: boolean
  onClose: () => void
}

export function PlaceDetailSidePanel({ place, isOpen = true, onClose }: Props) {
  return (
    <Drawer
      anchor="left"
      open={isOpen}
      onClose={onClose}
      hideBackdrop
      sx={{ zIndex: 10 }}
      PaperProps={{
        sx: {
          left: 72,
          width: 360,
          maxWidth: 'calc(100% - 72px)',
          zIndex: 1,
        },
      }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" p={2} pb={1}>
          <Box flex={1}>
            <Typography variant="subtitle1" fontWeight={700}>{place.name}</Typography>
          </Box>
          <IconButton size="small" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>

        <Box px={2} pb={2} overflow="auto" flex={1}>
          {place.address && (
            <Stack direction="row" alignItems="center" gap={0.25}>
              <LocationOnIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
              <Typography variant="caption" color="text.secondary">{place.address}</Typography>
            </Stack>
          )}

          {place.memo && (
            <Typography variant="body2" color="text.secondary" mt={1}>
              {place.memo}
            </Typography>
          )}

          <Box mt={1.5}>
            <Suspense fallback={<Box display="flex" justifyContent="center"><CircularProgress size={20} /></Box>}>
              <PlacePhotos placeId={place.id} />
            </Suspense>
          </Box>
        </Box>
      </Box>
    </Drawer>
  )
}

function PlacePhotos({ placeId }: { placeId: string }) {
  const { data: photos } = usePlacePhotos(placeId)
  const overlay = useOverlay()

  if (photos.length === 0) {
    return (
      <Typography variant="body2" color="text.disabled">사진이 없어요</Typography>
    )
  }

  return (
    <ImageList cols={2} gap={6} sx={{ m: 0 }}>
      {photos.map((photo, idx) => (
        <ImageListItem
          key={photo.id}
          sx={{ borderRadius: 2, overflow: 'hidden', cursor: 'pointer' }}
          onClick={() => {
            overlay.open(({ isOpen, close }) => (
              <PhotoBottomSheet
                isOpen={isOpen}
                onClose={close}
                photos={photos}
                initialIndex={idx}
              />
            ))
          }}
        >
          <img src={photo.url} alt="" loading="lazy" style={{ aspectRatio: '1', objectFit: 'cover', width: '100%' }} />
        </ImageListItem>
      ))}
    </ImageList>
  )
}
