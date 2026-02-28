import { Box, ImageList, Stack, Typography } from '@mui/material';
import { Suspense } from 'react';
import { PhotoGallery } from '../../../shared/components/photo/PhotoGallery';
import { PhotoUploader } from '../../../shared/components/photo/PhotoUploader';
import type { Photo } from '../../photo/photo.types';
import { usePlacePhotos } from './useTripPlacePhotos';


interface PlacePhotoSectionProps {
  tripId: string
  placeId: string
}

export function PlacePhotoSection({ tripId, placeId }: PlacePhotoSectionProps) {
  return (
    <Stack spacing={2} mt={2}>
      <Typography variant="subtitle2" fontWeight={600}>
        사진
      </Typography>
      <Suspense fallback={<Box height={80} />}>
        <PlacePhotoContent tripId={tripId} placeId={placeId} />
      </Suspense>
    </Stack>
  );
}

function PlacePhotoContent({ tripId, placeId }: PlacePhotoSectionProps) {
  const {
    data: photos,
    remove,
    upload,
    isUploading
  } = usePlacePhotos(placeId);



  const handleUpload = async (file: File) => {
    await upload({ file, tripId });
  };

  const handleDelete = async (photo: Photo) => {
    await remove(photo);
  };

  return (
    <Stack spacing={2}>
      <ImageList cols={4}>
        <PhotoUploader onUpload={handleUpload} isUploading={isUploading} />
        {photos.map(x => (
          <PhotoGallery.Item key={x.id} photo={x} onDelete={handleDelete} />
        ))}
      </ImageList>

    </Stack>
  );
}
