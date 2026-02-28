import { Box, Chip, ImageList, Stack, Typography } from '@mui/material';
import { useMemo, useState } from 'react';
import { useOverlay } from '~shared/hooks/useOverlay';
import { PhotoBottomSheet } from '~shared/components/photo/PhotoBottomSheet';
import { PhotoUploader } from '~shared/components/photo/PhotoUploader';
import { PhotoThunbnail } from '../../../shared/components/photo/PhotoThumbnail';
import type { Photo } from '../../photo/photo.types';
import { useTripPlaces } from '../trip-place/useTripPlaces';
import { useTripPhotos } from './useTripPhotos';

interface TripPhotoContentProps {
  tripId: string
}

export function TripPhotoContent({ tripId }: TripPhotoContentProps) {
  const { data: photos, upload, remove } = useTripPhotos(tripId)

  const { data: places } = useTripPlaces(tripId);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);

  const photosByPlace = useMemo(() => {
    const grouped: Record<string, Photo[]> = {};
    photos.forEach(photo => {
      if (photo.placeId == null) return;
      if (!grouped[photo.placeId]) {
        grouped[photo.placeId] = [];
      }
      grouped[photo.placeId].push(photo);
    });
    return grouped;
  }, [photos]);

  const placesWithPhotos = useMemo(() => {
    return places.filter(place => photosByPlace[place.id]?.length > 0);
  }, [places, photosByPlace]);

  const filteredPhotos = selectedPlaceId
    ? photosByPlace[selectedPlaceId] ?? []
    : photos;

  const overlay = useOverlay();

  if (photos.length === 0) {
    return (
      <Stack alignItems="center" justifyContent="center" flex={1} p={4}>
        <Typography color="text.secondary">
          아직 업로드된 사진이 없습니다.
        </Typography>
        <Typography variant="body2" color="text.secondary" mt={1}>
          장소 상세에서 사진을 추가해보세요.
        </Typography>
      </Stack>
    );
  }

  return (
    <Stack flex={1} p={2}>
      <Stack direction="row" gap={1} mb={2} flexWrap="wrap">
        <Chip
          label="전체"
          variant={selectedPlaceId === null ? 'filled' : 'outlined'}
          onClick={() => setSelectedPlaceId(null)}
          size="small"
        />
        {placesWithPhotos.map(place => (
          <Chip
            key={place.id}
            label={place.name}
            variant={selectedPlaceId === place.id ? 'filled' : 'outlined'}
            onClick={() => setSelectedPlaceId(place.id)}
            size="small"
          />
        ))}
      </Stack>
      <Box>
        <ImageList cols={3}>
          <PhotoUploader
            width="100%"
            onUpload={async (file) => {
              await upload({ file, placeId: selectedPlaceId ?? undefined })
            }}
          />
          {filteredPhotos.map((x, i) => (
            <PhotoThunbnail
              key={x.id}
              src={x.url}
              onClick={() => {
                overlay.open(({ isOpen, close }) => (
                  <PhotoBottomSheet
                    isOpen={isOpen}
                    onClose={close}
                    photos={photos}
                    onDelete={remove}
                    initialIndex={i}
                  />
                ))
              }}
            />
          ))}
        </ImageList>
      </Box>
    </Stack>
  );
}
