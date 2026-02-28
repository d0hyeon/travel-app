import { Box, ImageList, Stack, Typography } from '@mui/material';
import { Suspense } from 'react';
import { useIsMobile } from '~shared/hooks/useIsMobile';
import { useOverlay } from '~shared/hooks/useOverlay';
import { PhotoBottomSheet } from '~shared/components/photo/PhotoBottomSheet';
import { PhotoDialog } from '~shared/components/photo/PhotoDialog';
import { PhotoThunbnail } from '../../../shared/components/photo/PhotoThumbnail';
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

  const overlay = useOverlay();
  const isMobile = useIsMobile();



  const handleUpload = async (files: File[]) => {
    await upload({ files, tripId });
  };

  const handleDelete = async (photo: Photo) => {
    await remove(photo);
  };

  return (
    <Stack spacing={2}>
      <ImageList cols={5}>
        <PhotoUploader width="100%" onUpload={handleUpload} loading={isUploading} multiple />
        {photos.map((x, i) => (
          <PhotoThunbnail
            key={x.id}
            src={x.url}
            onClick={() => {
              overlay.open(({ isOpen, close }) => {
                if (isMobile) {
                  return (
                    <PhotoBottomSheet
                      isOpen={isOpen}
                      onClose={close}
                      photos={photos}
                      onDelete={handleDelete}
                      initialIndex={i}
                    />
                  )
                }
                return (
                  <PhotoDialog
                    open={isOpen}
                    onClose={close}
                    photos={photos}
                    onDelete={handleDelete}
                    initialIndex={i}
                  />
                )
              })
            }}
          />
        ))}
      </ImageList>

    </Stack>
  );
}
