import LocationOnIcon from '@mui/icons-material/LocationOn'
import {
  Box,
  CircularProgress,
  ImageList,
  ImageListItem,
  Stack,
  Typography,
} from '@mui/material'
import { Suspense } from 'react'
import type { Place } from '../place/place.types'
import { usePlacePhotos } from './usePlacePhotos'
import { BottomSheet } from '~shared/components/BottomSheet'
import { useOverlay } from '~shared/hooks/useOverlay'
import { PhotoBottomSheet } from '~shared/components/photo/PhotoBottomSheet'

interface Props {
  place: Place
  isOpen?: boolean;
  onClose: () => void
}

export function PlaceExplorerDetailBottomSheet({ isOpen, place, onClose }: Props) {
  return (
    <BottomSheet
      onClose={onClose}
      snapPoints={[0.5, 0.7, 0.95]}
      isOpen={isOpen}
    >
      <BottomSheet.Header>
        {place.name}
      </BottomSheet.Header>
      <BottomSheet.Body>
        {place.address && (
          <Stack direction="row" alignItems="center" gap={0.25} mt={0.25}>
            <LocationOnIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
            <Typography variant="caption" color="text.secondary">{place.address}</Typography>
          </Stack>
        )}
        {/* 메모 */}
        {place.memo && (
          <Typography variant="body2" color="text.secondary" px={2} mt={1}>
            {place.memo}
          </Typography>
        )}

        {/* 사진 */}
        <Box mt={1.5}>
          <Suspense fallback={<CircularProgress size={20} />}>
            <PlacePhotos placeId={place.id} />
          </Suspense>
        </Box>
      </BottomSheet.Body>



    </BottomSheet>
  )
}

function PlacePhotos({ placeId }: { placeId: string }) {
  const { data: photos } = usePlacePhotos(placeId);
  const overlay = useOverlay();

  if (photos.length === 0) {
    return (
      <Typography variant="body2" color="text.disabled">사진이 없어요</Typography>
    )
  }

  return (
    <ImageList cols={3} gap={4} sx={{ m: 0 }}>
      {photos.map((photo, idx) => (
        <ImageListItem
          key={photo.id}
          sx={{ borderRadius: 1.5, overflow: 'hidden' }}
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
