import { PlacePhotoStrip } from './PlacePhotoStrip'
import { usePlacePhotos } from './usePlacePhotos'

interface Props {
  placeId: string
}

export function PlacePhotoList({ placeId }: Props) {
  const { data: photos } = usePlacePhotos(placeId)

  if (photos.length === 0) {
    return null
  }

  return <PlacePhotoStrip photos={photos} />
}
