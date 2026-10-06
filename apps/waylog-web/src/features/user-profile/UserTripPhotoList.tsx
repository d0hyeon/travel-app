import { ImageList, ImageListItem } from "@mui/material";
import { useTripPhotos } from "~features/trip/trip-photo/useTripPhotos";
import { PhotoBottomSheet } from "~shared/components/photo/PhotoBottomSheet";
import { useOverlay } from "~shared/hooks/useOverlay";

type Props = {
  tripId: string;
}
export function UserTripPhotoList({ tripId }: Props) {
  const { data: photos } = useTripPhotos(tripId);
  const overlay = useOverlay();

  return (
    <ImageList cols={3}>
      {photos.map((photo, idx) => (
        <ImageListItem
          key={photo.id}
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
          <img src={photo.url} />
        </ImageListItem>
      ))}
    </ImageList>
  )
}
