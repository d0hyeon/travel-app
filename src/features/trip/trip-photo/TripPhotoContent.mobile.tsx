import { Box, Chip, ImageList, Stack } from '@mui/material';
import { useMemo, useState } from 'react';
import { PhotoBottomSheet } from '~shared/components/photo/PhotoBottomSheet';
import { PhotoUploader } from '~shared/components/photo/PhotoUploader';
import { useOverlay } from '~shared/hooks/useOverlay';
import { PhotoThunbnail } from '../../../shared/components/photo/PhotoThumbnail';
import type { Photo } from '../../photo/photo.types';
import { useTripPlaces } from '../trip-place/useTripPlaces';
import { useTripPhotos } from './useTripPhotos';

interface TripPhotoContentProps {
  tripId: string
}

export function preload(tripId: string) {
  useTripPhotos.prefetch(tripId);
}

export default function TripPhotoContent({ tripId }: TripPhotoContentProps) {
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


  return (
    <Stack flex={1} p={2}>
      <Stack direction="row" gap={1} mb={2} flexWrap="wrap">
        <Chip
          label="전체"
          variant={selectedPlaceId === null ? 'filled' : 'outlined'}
          onClick={() => setSelectedPlaceId(null)}
          size="small"
          sx={{ fontSize: 12 }}
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
            onUpload={async (files) => {
              await upload({ files, placeId: selectedPlaceId ?? undefined })
            }}
            multiple
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
