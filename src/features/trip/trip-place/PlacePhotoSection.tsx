import { ImageList, Stack, Typography } from '@mui/material';
import { useIsMobile } from '~shared/hooks/env/useIsMobile';
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
  // Suspense 경계를 두지 않고 상위(오버레이) 경계로 버블시킨다.
  // 사진까지 로드된 완성 상태로 시트가 마운트되어 자동 높이 측정이 정확해진다.
  return (
    <Stack spacing={2} mt={2}>
      <Typography variant="subtitle2" fontWeight={600}>
        사진
      </Typography>
      <PlacePhotoContent tripId={tripId} placeId={placeId} />
    </Stack>
  );
}

function PlacePhotoContent({ tripId, placeId }: PlacePhotoSectionProps) {
  const {
    data: photos,
    remove,
    upload,
    update,
    isUploading
  } = usePlacePhotos(placeId);

  const overlay = useOverlay();
  const isMobile = useIsMobile();
  const handleUpload = async (files: File[]) => {
    if (files.length === 0) return
    await upload({ files, tripId })
  }

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
                      onUpdate={(photo, patch) => update({ photoId: photo.id, tripId, ...patch })}
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
                    onUpdate={(photo, patch) => update({ photoId: photo.id, tripId, ...patch })}
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
