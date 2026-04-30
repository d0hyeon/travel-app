import { Box, Stack, type StackProps } from "@mui/material";
import { usePlacePhotos } from "./usePlacePhotos";
import { useOverlay } from "~shared/hooks/useOverlay";
import { useIsMobile } from "~shared/hooks/env/useIsMobile";
import { PhotoBottomSheet } from "~shared/components/photo/PhotoBottomSheet";
import { PhotoDialog } from "~shared/components/photo/PhotoDialog";

interface Props extends StackProps {
  placeId: string;
}

export function PlacePhotoList({ placeId, ...stackProps }: Props) {
  const { data: photos } = usePlacePhotos(placeId);
  const overlay = useOverlay();
  const isMobile = useIsMobile();
  const openPhotoViewer = (initialIndex: number) => {
    overlay.open(({ close, isOpen }) =>
      isMobile ? (
        <PhotoBottomSheet photos={photos} initialIndex={initialIndex} isOpen={isOpen} onClose={close} />
      ) : (
        <PhotoDialog photos={photos} initialIndex={initialIndex} open={isOpen} onClose={close} />
      )
    )
  }

  if (photos.length === 0) {
    return null;
  }

  return (
    <Stack spacing={1} {...stackProps}>
      {photos.map((photo, i) => (
        <Box
          key={photo.url}
          component="img"
          src={photo.url}
          onClick={() => openPhotoViewer(i)}
          sx={{ width: 100, height: 80, objectFit: 'cover', borderRadius: 1, flexShrink: 0, cursor: 'pointer' }}
        />
      ))}
    </Stack>
  )
}